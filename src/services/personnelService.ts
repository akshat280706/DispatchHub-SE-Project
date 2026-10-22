import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { AssignmentType, ParcelStatus } from '../types/database'

export interface PersonnelActiveAssignment {
  id: string
  assignment_type: AssignmentType
  assigned_at: string
  parcel: { id: string; tracking_number: string; status: ParcelStatus }
}

export interface PersonnelOverview {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_available: boolean
  active: PersonnelActiveAssignment[]
  completed: number
}

// Row Level Security limits this to delivery personnel of the manager's own branch.
async function overview(): Promise<PersonnelOverview[]> {
  const { data: people, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone,is_available')
    .eq('role', 'DELIVERY_PERSONNEL')
    .eq('is_active', true)
    .order('full_name')
  if (error) throw new AppError('Could not load delivery personnel.', error.code)
  const rows = people ?? []
  if (rows.length === 0) return []
  const ids = rows.map((p) => p.id as string)

  const [activeRes, ...completedRes] = await Promise.all([
    supabase
      .from('delivery_assignments')
      .select('id,personnel_id,assignment_type,assigned_at,parcel:parcels(id,tracking_number,status)')
      .in('personnel_id', ids)
      .eq('status', 'ACTIVE')
      .order('assigned_at', { ascending: false }),
    ...ids.map((id) =>
      supabase
        .from('delivery_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('personnel_id', id)
        .eq('status', 'COMPLETED'),
    ),
  ])
  if (activeRes.error) throw new AppError('Could not load assignments.', activeRes.error.code)

  const active = (activeRes.data ?? []) as unknown as (PersonnelActiveAssignment & { personnel_id: string })[]

  return rows.map((p, i) => ({
    id: p.id as string,
    full_name: p.full_name as string,
    email: p.email as string,
    phone: p.phone as string | null,
    is_available: p.is_available as boolean,
    active: active.filter((a) => a.personnel_id === p.id && a.parcel),
    completed: completedRes[i].count ?? 0,
  }))
}

export const personnelService = { overview }