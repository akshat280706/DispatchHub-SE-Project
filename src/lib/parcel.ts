import type { ParcelCategory, PaymentMethod, RateZone } from '../types/database'

export const CATEGORY_OPTIONS: { value: ParcelCategory; label: string }[] = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'GENERAL', label: 'General' },
  { value: 'FRAGILE', label: 'Fragile' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'OTHER', label: 'Other' },
]

export const CATEGORY_LABEL: Record<ParcelCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
) as Record<ParcelCategory, string>

export const ZONE_LABEL: Record<RateZone, string> = {
  LOCAL: 'Local (same city)',
  REGIONAL: 'Regional (same state)',
  NATIONAL: 'National (other state)',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ONLINE: 'Online payment',
  DEV_SIMULATED: 'Development payment (simulated)',
  CASH_ON_PICKUP: 'Cash on pickup',
}

export const customerRoutes = {
  dashboard: '/app/customer',
  book: '/app/customer/book',
  bookings: '/app/customer/bookings',
  profile: '/app/customer/profile',
  booking: (id: string) => `/app/customer/bookings/${id}`,
  pay: (id: string) => `/app/customer/bookings/${id}/pay`,
}
