import { ROLE_HOME } from './navigation'
import type { NotificationType, UserRole } from '../types/database'

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  BOOKING: 'Booking',
  PAYMENT: 'Payment',
  ASSIGNMENT: 'Assignment',
  STATUS: 'Status',
  DELIVERY: 'Delivery',
  COMPLAINT: 'Complaint',
  SYSTEM: 'System',
}

export const notificationRoute = (role: UserRole) => `${ROLE_HOME[role]}/notifications`

// Where "view parcel" should go for each role. Admins have no parcel page.
export function parcelLinkFor(role: UserRole, parcelId: string): string | null {
  switch (role) {
    case 'CUSTOMER':
      return `/app/customer/bookings/${parcelId}`
    case 'BRANCH_MANAGER':
      return `/app/manager/parcels/${parcelId}`
    case 'DELIVERY_PERSONNEL':
      return '/app/delivery/assignments'
    default:
      return null
  }
}
