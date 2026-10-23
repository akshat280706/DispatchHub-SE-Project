import type { UserRole } from '../types/database'

export interface NavItem {
  label: string
  to: string
  ready: boolean // false = not built yet, shown disabled (flip to true in the batch that builds it)
}

export const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: '/app/customer',
  DELIVERY_PERSONNEL: '/app/delivery',
  BRANCH_MANAGER: '/app/manager',
  ADMIN: '/app/admin',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: 'Customer',
  DELIVERY_PERSONNEL: 'Delivery personnel',
  BRANCH_MANAGER: 'Branch manager',
  ADMIN: 'Administrator',
}

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { label: 'Dashboard', to: '/app/customer', ready: true },
    { label: 'Book parcel', to: '/app/customer/book', ready: true },
    { label: 'My bookings', to: '/app/customer/bookings', ready: true },
    { label: 'Complaints', to: '/app/customer/complaints', ready: true },
    { label: 'Notifications', to: '/app/customer/notifications', ready: false },
    { label: 'Profile', to: '/app/customer/profile', ready: false },
  ],
  DELIVERY_PERSONNEL: [
    { label: 'Dashboard', to: '/app/delivery', ready: true },
    { label: 'Assignments', to: '/app/delivery/assignments', ready: true },
    { label: 'History', to: '/app/delivery/history', ready: true },
  ],
  BRANCH_MANAGER: [
    { label: 'Dashboard', to: '/app/manager', ready: true },
    { label: 'Parcels', to: '/app/manager/parcels', ready: true },
    { label: 'Assign', to: '/app/manager/assign', ready: true },
    { label: 'Personnel', to: '/app/manager/personnel', ready: true },
    { label: 'Complaints', to: '/app/manager/complaints', ready: true },
    { label: 'Reports', to: '/app/manager/reports', ready: true },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/app/admin', ready: true },
    { label: 'Users', to: '/app/admin/users', ready: true },
    { label: 'Branches', to: '/app/admin/branches', ready: false },
    { label: 'Shipping rates', to: '/app/admin/rates', ready: false },
    { label: 'Settings', to: '/app/admin/settings', ready: false },
    { label: 'Complaints', to: '/app/admin/complaints', ready: false },
    { label: 'Audit logs', to: '/app/admin/audit', ready: false },
    { label: 'Reports', to: '/app/admin/reports', ready: false },
  ],
}