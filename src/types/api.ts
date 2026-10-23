import type { ParcelCategory, PaymentMethod, RateZone } from './database'

export interface QuoteInput {
  origin_branch_id: string
  destination_branch_id: string
  category: ParcelCategory
  weight_kg: number
}

export interface Quote {
  zone: RateZone
  base_charge: number
  base_weight_kg: number
  extra_weight_kg: number
  extra_charge: number
  handling_surcharge: number
  shipping_charge: number
  gst_percent: number
  tax_amount: number
  total_amount: number
  estimated_days: number
  estimated_delivery_date: string
}

export interface BookingPayload {
  origin_branch_id: string
  destination_branch_id: string
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
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  description: string
  special_instructions: string
  payment_method: PaymentMethod
}

export interface CustomerStats {
  total_bookings: number
  active_shipments: number
  delivered: number
  cancelled: number
  open_complaints: number
  unread_notifications: number
}

export interface PersonnelStats {
  assigned_total: number
  pending_pickups: number
  pending_deliveries: number
  out_for_delivery: number
  completed_pickups: number
  completed_deliveries: number
  completed_today: number
}

export interface BranchStats {
  branch: { id: string; code: string; name: string; city: string }
  from: string
  to: string
  parcel_count: number
  by_status: Record<string, number>
  pending_assignments: number
  in_transit: number
  delayed: number
  personnel: { id: string; full_name: string; is_available: boolean; active_assignments: number }[]
  complaints: Record<string, number>
  daily: { date: string; bookings: number }[]
}
export interface AdminStats {
  from: string
  to: string
  users: { total: number; active: number; by_role: Record<string, number> }
  parcels: {
    total: number
    active: number
    delivered: number
    cancelled: number
    delayed: number
    in_range: number
    by_status: Record<string, number>
  }
  payments: {
    success_count: number
    success_amount: number
    pending_count: number
    pending_amount: number
    failed_count: number
    refunded_count: number
    refunded_amount: number
  }
  branches: {
    id: string
    code: string
    name: string
    city: string
    origin_parcels: number
    destination_parcels: number
    active_parcels: number
  }[]
  complaints: Record<string, number>
  daily: { date: string; bookings: number; revenue: number }[]
}
