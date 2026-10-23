import type { UserRole } from '../types/database'

export const adminRoutes = {
  dashboard: '/app/admin',
  users: '/app/admin/users',
  branches: '/app/admin/branches',
  rates: '/app/admin/rates',
  settings: '/app/admin/settings',
  complaints: '/app/admin/complaints',
  audit: '/app/admin/audit',
  reports: '/app/admin/reports',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'DELIVERY_PERSONNEL', label: 'Delivery personnel' },
  { value: 'BRANCH_MANAGER', label: 'Branch manager' },
  { value: 'ADMIN', label: 'Administrator' },
]

export const needsBranch = (role: string) => role === 'BRANCH_MANAGER' || role === 'DELIVERY_PERSONNEL'
