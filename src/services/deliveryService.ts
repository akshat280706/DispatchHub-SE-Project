import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { AssignmentStatus, AssignmentType, ParcelCategory, ParcelStatus } from '../types/database'

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

export const deliveryService = {
  getDevOtp,
  listActive,
  getAssignment,
  getCashDue,
  markPickedUp,
  startDelivery,
  markCashCollected,
}