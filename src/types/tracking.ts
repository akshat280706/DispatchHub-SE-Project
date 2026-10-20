import type { ParcelStatus } from './database'

export interface TrackingEvent {
  status: ParcelStatus
  occurred_at: string
  branch_city: string | null
  description: string | null
}

export interface PublicTracking {
  tracking_number: string
  status: ParcelStatus
  booked_at: string
  origin: { city: string; branch_name: string }
  destination: { city: string; branch_name: string }
  estimated_delivery_date: string | null
  events: TrackingEvent[]
}