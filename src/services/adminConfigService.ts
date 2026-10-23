import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { Paged, ParcelCategory, RateZone } from '../types/database'
import type { BranchInput, RateInput } from '../schemas/adminConfig'

export interface AdminBranch {
  id: string
  code: string
  name: string
  city: string
  state: string
  address: string | null
  pincode: string | null
  phone: string | null
  is_active: boolean
}

export interface RateRow {
  id: string
  zone: RateZone
  category: ParcelCategory
  base_charge: number
  base_weight_kg: number
  per_kg_charge: number
  handling_surcharge: number
  is_active: boolean
}

export interface SettingRow {
  key: string
  value: unknown
  description: string | null
  is_public: boolean
  updated_at: string
}

export interface AuditRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  old_data: unknown
  new_data: unknown
  created_at: string
  actor: { full_name: string; email: string } | null
}

export interface AuditFilters {
  entity: string
  action: string
  from: string // yyyy-mm-dd, India time
  to: string
  page: number
  pageSize: number
}

// Admins can read inactive branches too (Row Level Security).
async function listBranches(): Promise<AdminBranch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id,code,name,city,state,address,pincode,phone,is_active')
    .order('code')
  if (error) throw new AppError('Could not load branches.', error.code)
  return (data ?? []) as AdminBranch[]
}

async function saveBranch(id: string | null, v: BranchInput): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_branch', {
    p_id: id,
    p_code: v.code.trim().toUpperCase(),
    p_name: v.name.trim(),
    p_city: v.city.trim(),
    p_state: v.state.trim(),
    p_address: v.address.trim() || null,
    p_pincode: v.pincode.trim() || null,
    p_phone: v.phone.trim() || null,
    p_is_active: v.is_active,
  })
  if (error) throw rpcError(error, 'The branch could not be saved. Please try again.')
}

async function listRates(): Promise<RateRow[]> {
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('id,zone,category,base_charge,base_weight_kg,per_kg_charge,handling_surcharge,is_active')
    .order('zone')
    .order('category')
  if (error) throw new AppError('Could not load shipping rates.', error.code)
  return (data ?? []) as RateRow[]
}

async function saveRate(id: string | null, v: RateInput): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_rate', {
    p_id: id,
    p_zone: v.zone,
    p_category: v.category,
    p_base_charge: Number(v.base_charge),
    p_base_weight_kg: Number(v.base_weight_kg),
    p_per_kg_charge: Number(v.per_kg_charge),
    p_handling_surcharge: Number(v.handling_surcharge),
    p_is_active: v.is_active,
  })
  if (error) throw rpcError(error, 'The rate could not be saved. Please try again.')
}

async function listSettings(): Promise<SettingRow[]> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key,value,description,is_public,updated_at')
    .order('key')
  if (error) throw new AppError('Could not load settings.', error.code)
  return (data ?? []) as SettingRow[]
}

async function updateSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.rpc('admin_update_setting', { p_key: key, p_value: value })
  if (error) throw rpcError(error, 'The setting could not be saved. Please try again.')
}

async function listAudit(f: AuditFilters): Promise<Paged<AuditRow>> {
  let q = supabase
    .from('audit_logs')
    .select('id,action,entity_type,entity_id,old_data,new_data,created_at,actor:profiles(full_name,email)', { count: 'exact' })

  const action = f.action.replace(/[^A-Za-z0-9_]/g, '')
  if (action) q = q.ilike('action', `%${action}%`)
  if (f.entity) q = q.eq('entity_type', f.entity)
  if (f.from) q = q.gte('created_at', new Date(`${f.from}T00:00:00+05:30`).toISOString())
  if (f.to) q = q.lte('created_at', new Date(`${f.to}T23:59:59.999+05:30`).toISOString())

  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(start, start + f.pageSize - 1)
  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load the audit log.', error.code)
  }
  return { data: (data ?? []) as unknown as AuditRow[], total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

export const adminConfigService = {
  listBranches,
  saveBranch,
  listRates,
  saveRate,
  listSettings,
  updateSetting,
  listAudit,
}
