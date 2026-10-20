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