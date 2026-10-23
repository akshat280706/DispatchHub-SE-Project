import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { Paged, UserRole } from '../types/database'
import type { CreateStaffInput } from '../schemas/user'

export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  branch_id: string | null
  is_active: boolean
  is_available: boolean
  created_at: string
}

export interface UserFilters {
  search: string
  role: UserRole | ''
  status: '' | 'active' | 'inactive'
  page: number
  pageSize: number
}

// Row Level Security lets only administrators read every profile.
async function listUsers(f: UserFilters): Promise<Paged<AdminUser>> {
  let q = supabase
    .from('profiles')
    .select('id,full_name,email,phone,role,branch_id,is_active,is_available,created_at', { count: 'exact' })

  const term = f.search.replace(/[^A-Za-z0-9 .@_-]/g, '').trim()
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
  if (f.role) q = q.eq('role', f.role)
  if (f.status) q = q.eq('is_active', f.status === 'active')

  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(start, start + f.pageSize - 1)
  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load users.', error.code)
  }
  return { data: (data ?? []) as AdminUser[], total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

async function updateUser(userId: string, role: UserRole, branchId: string | null, isActive: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user', {
    p_user_id: userId,
    p_role: role,
    p_branch_id: branchId,
    p_is_active: isActive,
  })
  if (error) throw rpcError(error, 'The user could not be updated. Please try again.')
}

async function createStaff(input: CreateStaffInput): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-create-user', {
    body: {
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      branch_id: input.role === 'ADMIN' ? null : input.branch_id,
      password: input.password,
    },
  })
  if (error) {
    let message = 'The account could not be created. Please try again.'
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as { error?: string }
        if (body?.error) message = body.error
      } catch {
        /* keep the generic message */
      }
    }
    throw new AppError(message)
  }
}

export const adminService = { listUsers, updateUser, createStaff }