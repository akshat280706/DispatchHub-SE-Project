import type { AssignmentType } from '../types/database'

export const deliveryRoutes = {
  dashboard: '/app/delivery',
  assignments: '/app/delivery/assignments',
  assignment: (id: string) => `/app/delivery/assignments/${id}`,
  history: '/app/delivery/history',
}

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
}