import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { AssignmentStatus, AssignmentType, Branch, Paged, Parcel, ParcelStatus, Payment } from '../types/database'
import type { TrackingEvent } from '../types/tracking'

export interface ManagerParcelItem {
  id: string
  tracking_number: string
  status: ParcelStatus
  total_amount: number
  created_at: string
  origin_branch_id: string
  destination_branch_id: string
  sender_name: string
  receiver_name: string
  delivery_city: string
  estimated_delivery_date: string | null
}

export interface ManagerFilters {
  search: string
  status: ParcelStatus | ''
  page: number
  pageSize: number
}

export interface PersonnelOption {
  id: string
  full_name: string
  phone: string | null
  is_available: boolean
}

export interface AssignmentRecord {
  id: string
  personnel_id: string
  assignment_type: AssignmentType
  status: AssignmentStatus
  reassign_reason: string | null
  assigned_at: string
  completed_at: string | null
  personnel_name: string
}

export interface ManagerParcelDetail {
  parcel: Parcel
  origin: Branch | null
  destination: Branch | null
  events: TrackingEvent[]
  payments: Payment[]
  assignments: AssignmentRecord[]
}

export interface WorkQueue {
  pickups: ManagerParcelItem[]
  dispatch: ManagerParcelItem[]
  arrivals: ManagerParcelItem[]
  deliveries: ManagerParcelItem[]
}

const LIST_SELECT =
  'id,tracking_number,status,total_amount,created_at,origin_branch_id,destination_branch_id,sender_name,receiver_name,delivery_city,estimated_delivery_date'

// Row Level Security limits this to parcels that start or end at the manager's branch.
async function listParcels(f: ManagerFilters): Promise<Paged<ManagerParcelItem>> {
  let q = supabase.from('parcels').select(LIST_SELECT, { count: 'exact' })

  const term = f.search.replace(/[^A-Za-z0-9 .-]/g, '').trim()
  if (term) {
    q = q.or(`tracking_number.ilike.%${term}%,receiver_name.ilike.%${term}%,sender_name.ilike.%${term}%`)
  }
  if (f.status) q = q.eq('status', f.status)

  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(start, start + f.pageSize - 1)
  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load parcels.', error.code)
  }
  return { data: (data ?? []) as ManagerParcelItem[], total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

async function fetchQueue(
  field: 'origin_branch_id' | 'destination_branch_id',
  branchId: string,
  statuses: ParcelStatus[],
): Promise<ManagerParcelItem[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select(LIST_SELECT)
    .eq(field, branchId)
    .in('status', statuses)
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) throw new AppError('Could not load the work queue.', error.code)
  return (data ?? []) as ManagerParcelItem[]
}

async function getQueue(branchId: string): Promise<WorkQueue> {
  const [pickups, dispatch, arrivals, candidates] = await Promise.all([
    fetchQueue('origin_branch_id', branchId, ['CONFIRMED']),
    fetchQueue('origin_branch_id', branchId, ['PICKED_UP']),
    fetchQueue('destination_branch_id', branchId, ['IN_TRANSIT']),
    fetchQueue('destination_branch_id', branchId, ['AT_DESTINATION_BRANCH', 'DELIVERY_FAILED']),
  ])

  // Only parcels that do not yet have an active delivery assignment need one
  let deliveries = candidates
  if (candidates.length > 0) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('parcel_id')
      .in('parcel_id', candidates.map((p) => p.id))
      .eq('assignment_type', 'DELIVERY')
      .eq('status', 'ACTIVE')
    if (error) throw new AppError('Could not load the work queue.', error.code)
    const assigned = new Set((data ?? []).map((r) => r.parcel_id as string))
    deliveries = candidates.filter((p) => !assigned.has(p.id))
  }
  return { pickups, dispatch, arrivals, deliveries }
}

async function getDetail(id: string): Promise<ManagerParcelDetail | null> {
  const { data: parcel, error } = await supabase.from('parcels').select('*').eq('id', id).maybeSingle()
  if (error) throw new AppError('Could not load this parcel.', error.code)
  if (!parcel) return null
  const p = parcel as Parcel

  const [branchesRes, eventsRes, paymentsRes, assignRes] = await Promise.all([
    supabase.from('branches').select('id,code,name,city,state').in('id', [p.origin_branch_id, p.destination_branch_id]),
    supabase
      .from('tracking_events')
      .select('status,created_at,branch_id,description,location_note')
      .eq('parcel_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('payments').select('*').eq('parcel_id', id).order('created_at', { ascending: false }),
    supabase
      .from('delivery_assignments')
      .select('id,personnel_id,assignment_type,status,reassign_reason,assigned_at,completed_at')
      .eq('parcel_id', id)
      .order('assigned_at', { ascending: false }),
  ])
  if (branchesRes.error || eventsRes.error || paymentsRes.error || assignRes.error) {
    throw new AppError('Could not load the full parcel details.')
  }

  const branches = (branchesRes.data ?? []) as Branch[]
  const byId = new Map(branches.map((b) => [b.id, b]))

  const events: TrackingEvent[] = (eventsRes.data ?? []).map((e) => ({
    status: e.status,
    occurred_at: e.created_at,
    branch_city: e.branch_id ? (byId.get(e.branch_id)?.city ?? null) : null,
    // Staff notes are visible here, but never on public tracking
    description: [e.description, e.location_note ? `Note: ${e.location_note}` : null].filter(Boolean).join(' | ') || null,
  }))

  // Managers can read riders of their own branch only; others show a generic label
  const rows = assignRes.data ?? []
  const ids = [...new Set(rows.map((r) => r.personnel_id as string))]
  const names = new Map<string, string>()
  if (ids.length > 0) {
    const { data: people } = await supabase.from('profiles').select('id,full_name').in('id', ids)
    for (const person of people ?? []) names.set(person.id as string, person.full_name as string)
  }
  const assignments: AssignmentRecord[] = rows.map((r) => ({
    id: r.id as string,
    personnel_id: r.personnel_id as string,
    assignment_type: r.assignment_type as AssignmentType,
    status: r.status as AssignmentStatus,
    reassign_reason: r.reassign_reason as string | null,
    assigned_at: r.assigned_at as string,
    completed_at: r.completed_at as string | null,
    personnel_name: names.get(r.personnel_id as string) ?? 'Rider from another branch',
  }))

  return {
    parcel: p,
    origin: byId.get(p.origin_branch_id) ?? null,
    destination: byId.get(p.destination_branch_id) ?? null,
    events,
    payments: (paymentsRes.data ?? []) as Payment[],
    assignments,
  }
}

// Row Level Security limits this to delivery personnel of the manager's own branch.
async function listPersonnel(): Promise<PersonnelOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,phone,is_available')
    .eq('role', 'DELIVERY_PERSONNEL')
    .eq('is_active', true)
    .order('full_name')
  if (error) throw new AppError('Could not load delivery personnel.', error.code)
  return (data ?? []) as PersonnelOption[]
}

async function assign(parcelId: string, personnelId: string, type: AssignmentType, reason: string | null): Promise<void> {
  const { error } = await supabase.rpc('assign_parcel', {
    p_parcel_id: parcelId,
    p_personnel_id: personnelId,
    p_type: type,
    p_reason: reason,
  })
  if (error) throw rpcError(error, 'The assignment could not be saved. Please try again.')
}

async function updateStatus(parcelId: string, status: ParcelStatus, note: string | null): Promise<void> {
  const { error } = await supabase.rpc('update_parcel_status', {
    p_parcel_id: parcelId,
    p_new_status: status,
    p_note: note,
    p_location_note: null,
  })
  if (error) throw rpcError(error, 'The status could not be updated. Please try again.')
}

export const managerService = { listParcels, getQueue, getDetail, listPersonnel, assign, updateStatus }
