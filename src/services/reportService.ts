import { supabase } from '../lib/supabaseClient'
import { rpcError } from '../lib/rpc'
import type { AdminStats, BranchStats, CustomerStats, PersonnelStats } from '../types/api'

async function customer(): Promise<CustomerStats> {
  const { data, error } = await supabase.rpc('get_customer_stats')
  if (error) throw rpcError(error, 'Could not load your statistics.')
  return data as CustomerStats
}

async function personnel(): Promise<PersonnelStats> {
  const { data, error } = await supabase.rpc('get_personnel_stats')
  if (error) throw rpcError(error, 'Could not load your statistics.')
  return data as PersonnelStats
}

// Managers always get their own branch. Dates are yyyy-mm-dd (India time); empty means last 30 days.
async function branch(from?: string, to?: string, branchId?: string): Promise<BranchStats> {
  const { data, error } = await supabase.rpc('get_branch_stats', {
    p_from: from || null,
    p_to: to || null,
    p_branch_id: branchId || null,
  })
  if (error) throw rpcError(error, 'Could not load the branch statistics.')
  return data as BranchStats
}

async function admin(from?: string, to?: string): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('get_admin_stats', { p_from: from || null, p_to: to || null })
  if (error) throw rpcError(error, 'Could not load the system statistics.')
  return data as AdminStats
}

export const reportService = { customer, personnel, branch, admin }