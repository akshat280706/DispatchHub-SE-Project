import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { Branch } from '../types/database'

async function listActive(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id,code,name,city,state')
    .eq('is_active', true)
    .order('city')
    .order('name')
  if (error) throw new AppError('Could not load branches. Please try again.', error.code)
  return (data ?? []) as Branch[]
}

export const branchService = { listActive }