import { supabase } from '../lib/supabaseClient'
import { rpcError } from '../lib/rpc'
import type { CustomerStats } from '../types/api'

async function customer(): Promise<CustomerStats> {
  const { data, error } = await supabase.rpc('get_customer_stats')
  if (error) throw rpcError(error, 'Could not load your statistics.')
  return data as CustomerStats
}

export const reportService = { customer }