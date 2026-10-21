import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { Branch, Paged, Parcel, ParcelStatus, Payment } from '../types/database'
import type { BookingPayload, Quote, QuoteInput } from '../types/api'
import type { TrackingEvent } from '../types/tracking'

export type ParcelSummary = Pick<
  Parcel,
  'id' | 'tracking_number' | 'status' | 'total_amount' | 'created_at' | 'origin_branch_id' | 'destination_branch_id'
>

export type ParcelListItem = ParcelSummary & Pick<Parcel, 'receiver_name' | 'delivery_city'>

export interface ParcelFilters {
  search: string
  status: ParcelStatus | ''
  from: string // yyyy-mm-dd, India time
  to: string // yyyy-mm-dd, India time
  page: number
  pageSize: number
}

export interface ParcelDetail {
  parcel: Parcel
  origin: Branch | null
  destination: Branch | null
  events: TrackingEvent[]
  payments: Payment[]
}

async function quote(input: QuoteInput): Promise<Quote> {
  const { data, error } = await supabase.rpc('calculate_shipping_quote', {
    p_origin_branch_id: input.origin_branch_id,
    p_destination_branch_id: input.destination_branch_id,
    p_category: input.category,
    p_weight_kg: input.weight_kg,
    p_length_cm: null,
    p_width_cm: null,
    p_height_cm: null,
  })
  if (error) throw rpcError(error, 'We could not calculate the price right now.')
  return data as Quote
}

async function book(payload: BookingPayload, idempotencyKey: string): Promise<Parcel> {
  const { data, error } = await supabase.rpc('create_parcel_booking', {
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
  })
  if (error) throw rpcError(error, 'Your booking could not be saved. Please try again.')
  return data as Parcel
}

async function cancel(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_parcel', { p_parcel_id: id, p_reason: reason })
  if (error) throw rpcError(error, 'This booking could not be cancelled. Please try again.')
}

async function listRecent(limit = 5): Promise<ParcelSummary[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select('id,tracking_number,status,total_amount,created_at,origin_branch_id,destination_branch_id')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new AppError('Could not load your bookings.', error.code)
  return (data ?? []) as ParcelSummary[]
}

// Row Level Security limits this to the signed-in customer's own parcels.
async function listMine(filters: ParcelFilters): Promise<Paged<ParcelListItem>> {
  const { page, pageSize } = filters
  let q = supabase
    .from('parcels')
    .select(
      'id,tracking_number,status,total_amount,created_at,origin_branch_id,destination_branch_id,receiver_name,delivery_city',
      { count: 'exact' },
    )

  // Keep only safe characters so the term cannot break the filter syntax.
  const term = filters.search.replace(/[^A-Za-z0-9 .-]/g, '').trim()
  if (term) q = q.or(`tracking_number.ilike.%${term}%,receiver_name.ilike.%${term}%`)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.from) q = q.gte('created_at', new Date(`${filters.from}T00:00:00+05:30`).toISOString())
  if (filters.to) q = q.lte('created_at', new Date(`${filters.to}T23:59:59.999+05:30`).toISOString())

  const start = (page - 1) * pageSize
  const { data, count, error } = await q
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1)

  if (error) {
    // Asking for a page past the end: show an empty page instead of an error
    if (error.code === 'PGRST103') return { data: [], total: 0, page, pageSize }
    throw new AppError('Could not load your bookings.', error.code)
  }
  return { data: (data ?? []) as ParcelListItem[], total: count ?? 0, page, pageSize }
}

// Returns null when the parcel does not exist or is not visible to this user (Row Level Security).
async function getById(id: string): Promise<ParcelDetail | null> {
  const { data: parcel, error } = await supabase.from('parcels').select('*').eq('id', id).maybeSingle()
  if (error) throw new AppError('Could not load this booking.', error.code)
  if (!parcel) return null
  const p = parcel as Parcel

  const [branchesRes, eventsRes, paymentsRes] = await Promise.all([
    supabase
      .from('branches')
      .select('id,code,name,city,state')
      .in('id', [p.origin_branch_id, p.destination_branch_id]),
    supabase
      .from('tracking_events')
      .select('status,created_at,branch_id,description')
      .eq('parcel_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('payments').select('*').eq('parcel_id', id).order('created_at', { ascending: false }),
  ])
  if (branchesRes.error || eventsRes.error || paymentsRes.error) {
    throw new AppError('Could not load the full booking details.')
  }

  const branches = (branchesRes.data ?? []) as Branch[]
  const byId = new Map(branches.map((b) => [b.id, b]))

  const events: TrackingEvent[] = (eventsRes.data ?? []).map((e) => ({
    status: e.status,
    occurred_at: e.created_at,
    branch_city: e.branch_id ? (byId.get(e.branch_id)?.city ?? null) : null,
    description: e.description,
  }))

  return {
    parcel: p,
    origin: byId.get(p.origin_branch_id) ?? null,
    destination: byId.get(p.destination_branch_id) ?? null,
    events,
    payments: (paymentsRes.data ?? []) as Payment[],
  }
}

export const parcelService = { quote, book, cancel, listRecent, listMine, getById }