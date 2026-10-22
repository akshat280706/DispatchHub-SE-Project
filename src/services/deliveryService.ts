import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import { prepareProofImage } from '../lib/image'
import type { AssignmentStatus, AssignmentType, Paged, ParcelCategory, ParcelStatus } from '../types/database'

const PROOF_BUCKET = 'delivery-proofs'

export interface DevDeliveryOtp {
  otp: string
  expires_at: string
  attempts_left: number
  notice: string
}

export interface AssignmentParcel {
  id: string
  tracking_number: string
  status: ParcelStatus
  sender_name: string
  sender_phone: string
  pickup_address: string
  receiver_name: string
  receiver_phone: string
  delivery_address: string
  delivery_city: string
  delivery_pincode: string
  category: ParcelCategory
  weight_kg: number
  description: string | null
  special_instructions: string | null
}

export interface AssignmentItem {
  id: string
  assignment_type: AssignmentType
  status: AssignmentStatus
  assigned_at: string
  completed_at: string | null
  parcel: AssignmentParcel
}

export interface CashDue {
  payment_id: string
  amount: number
}

export interface ProofItem {
  id: string
  storage_path: string
  created_at: string
  url: string | null
}

export interface VerifyResult {
  verified: boolean
  attempts_left?: number
  status?: string
}

export interface HistoryFilters {
  type: AssignmentType | ''
  from: string // yyyy-mm-dd, India time
  to: string // yyyy-mm-dd, India time
  page: number
  pageSize: number
}

const ASSIGNMENT_SELECT =
  'id,assignment_type,status,assigned_at,completed_at,' +
  'parcel:parcels(id,tracking_number,status,sender_name,sender_phone,pickup_address,receiver_name,receiver_phone,' +
  'delivery_address,delivery_city,delivery_pincode,category,weight_kg,description,special_instructions)'

// Returns null unless development mode is on and the parcel is out for delivery.
async function getDevOtp(parcelId: string): Promise<DevDeliveryOtp | null> {
  const { data, error } = await supabase.rpc('get_dev_delivery_otp', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not load the delivery code.')
  return (data as DevDeliveryOtp | null) ?? null
}

// Row Level Security limits this to the signed-in rider's own assignments.
async function listActive(type: AssignmentType | ''): Promise<AssignmentItem[]> {
  let q = supabase.from('delivery_assignments').select(ASSIGNMENT_SELECT).eq('status', 'ACTIVE')
  if (type) q = q.eq('assignment_type', type)
  const { data, error } = await q.order('assigned_at', { ascending: false })
  if (error) throw new AppError('Could not load your assignments.', error.code)
  return ((data ?? []) as unknown as AssignmentItem[]).filter((a) => a.parcel)
}

// Finished work only. Reassigned or cancelled assignments are not shown to the rider.
async function listHistory(f: HistoryFilters): Promise<Paged<AssignmentItem>> {
  let q = supabase.from('delivery_assignments').select(ASSIGNMENT_SELECT, { count: 'exact' }).eq('status', 'COMPLETED')
  if (f.type) q = q.eq('assignment_type', f.type)
  if (f.from) q = q.gte('completed_at', new Date(`${f.from}T00:00:00+05:30`).toISOString())
  if (f.to) q = q.lte('completed_at', new Date(`${f.to}T23:59:59.999+05:30`).toISOString())

  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q
    .order('completed_at', { ascending: false })
    .range(start, start + f.pageSize - 1)

  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load your history.', error.code)
  }
  const rows = ((data ?? []) as unknown as AssignmentItem[]).filter((a) => a.parcel)
  return { data: rows, total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

async function getAssignment(id: string): Promise<AssignmentItem | null> {
  const { data, error } = await supabase.from('delivery_assignments').select(ASSIGNMENT_SELECT).eq('id', id).maybeSingle()
  if (error) throw new AppError('Could not load this assignment.', error.code)
  const item = data as unknown as AssignmentItem | null
  return item && item.parcel ? item : null
}

async function getCashDue(parcelId: string): Promise<CashDue | null> {
  const { data, error } = await supabase.rpc('get_cash_due', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not check the cash payment.')
  return (data as CashDue | null) ?? null
}

async function markPickedUp(parcelId: string): Promise<void> {
  const { error } = await supabase.rpc('update_parcel_status', {
    p_parcel_id: parcelId,
    p_new_status: 'PICKED_UP',
    p_note: null,
    p_location_note: null,
  })
  if (error) throw rpcError(error, 'Could not mark the parcel as picked up. Please try again.')
}

async function startDelivery(parcelId: string): Promise<void> {
  const { error } = await supabase.rpc('start_delivery', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not start the delivery. Please try again.')
}

async function markCashCollected(parcelId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_cash_collected', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not record the cash payment. Please try again.')
}

// 1) upload to the private bucket under {parcel_id}/..., 2) register the file in the database.
async function uploadProof(parcelId: string, file: File): Promise<string> {
  const blob = await prepareProofImage(file)
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${parcelId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
  if (uploadError) {
    throw new AppError(
      'The photo could not be uploaded. Photos can only be added while the parcel is out for delivery and assigned to you.',
    )
  }

  const { data, error } = await supabase.rpc('register_delivery_proof', {
    p_parcel_id: parcelId,
    p_storage_path: path,
    p_proof_type: 'PHOTO',
  })
  if (error) throw rpcError(error, 'The photo was uploaded but could not be saved. Please try again.')
  return data as string
}

// The rider's own proofs for this parcel, with short-lived (5 minute) signed links for preview.
async function listProofs(parcelId: string, userId: string): Promise<ProofItem[]> {
  const { data, error } = await supabase
    .from('delivery_proofs')
    .select('id,storage_path,created_at')
    .eq('parcel_id', parcelId)
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: true })
  if (error) throw new AppError('Could not load the delivery photos.', error.code)

  return Promise.all(
    (data ?? []).map(async (r) => {
      const { data: signed } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(r.storage_path as string, 300)
      return {
        id: r.id as string,
        storage_path: r.storage_path as string,
        created_at: r.created_at as string,
        url: signed?.signedUrl ?? null,
      }
    }),
  )
}

// A wrong code is a normal result ({verified:false}), not an error, so the attempt is still counted.
async function verifyDelivery(parcelId: string, otp: string, proofIds: string[]): Promise<VerifyResult> {
  const { data, error } = await supabase.rpc('verify_delivery', {
    p_parcel_id: parcelId,
    p_otp: otp,
    p_proof_ids: proofIds,
  })
  if (error) throw rpcError(error, 'The delivery could not be verified. Please try again.')
  return data as VerifyResult
}

async function recordFailure(parcelId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('record_delivery_failure', { p_parcel_id: parcelId, p_reason: reason })
  if (error) throw rpcError(error, 'Could not record the failed attempt. Please try again.')
}

export const deliveryService = {
  getDevOtp,
  listActive,
  listHistory,
  getAssignment,
  getCashDue,
  markPickedUp,
  startDelivery,
  markCashCollected,
  uploadProof,
  listProofs,
  verifyDelivery,
  recordFailure,
}