export type UserRole = 'CUSTOMER' | 'DELIVERY_PERSONNEL' | 'BRANCH_MANAGER' | 'ADMIN'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  role: UserRole
  branch_id: string | null
  is_active: boolean
  is_available: boolean
  created_at: string
  updated_at: string
}

export type ParcelStatus =
  | 'BOOKED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_DESTINATION_BRANCH'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNED'
  | 'CANCELLED'

export type ParcelCategory = 'DOCUMENT' | 'GENERAL' | 'FRAGILE' | 'ELECTRONICS' | 'CLOTHING' | 'OTHER'
export type RateZone = 'LOCAL' | 'REGIONAL' | 'NATIONAL'
export type PaymentMethod = 'ONLINE' | 'DEV_SIMULATED' | 'CASH_ON_PICKUP'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type NotificationType =
  | 'BOOKING'
  | 'PAYMENT'
  | 'ASSIGNMENT'
  | 'STATUS'
  | 'DELIVERY'
  | 'COMPLAINT'
  | 'SYSTEM'

export interface Paged<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface Branch {
  id: string
  code: string
  name: string
  city: string
  state: string
}

export interface Parcel {
  id: string
  tracking_number: string
  customer_id: string
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
  description: string | null
  special_instructions: string | null
  zone: RateZone
  shipping_charge: number
  tax_amount: number
  total_amount: number
  status: ParcelStatus
  estimated_delivery_date: string | null
  cancelled_reason: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  parcel_id: string
  customer_id: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  provider: string | null
  transaction_reference: string | null
  failure_reason: string | null
  paid_at: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  parcel_id: string | null
  is_read: boolean
  created_at: string
}

export type AssignmentType = 'PICKUP' | 'DELIVERY'
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'REASSIGNED' | 'CANCELLED'

export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'

