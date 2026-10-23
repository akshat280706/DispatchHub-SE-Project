import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { Paged } from '../types/database'

export interface ContactMessageRow {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'NEW' | 'READ'
  created_at: string
}

export interface MessageFilters {
  status: '' | 'NEW' | 'READ'
  page: number
  pageSize: number
}

// Row Level Security lets only administrators read contact messages.
async function list(f: MessageFilters): Promise<Paged<ContactMessageRow>> {
  let q = supabase.from('contact_messages').select('id,name,email,subject,message,status,created_at', { count: 'exact' })
  if (f.status) q = q.eq('status', f.status)
  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(start, start + f.pageSize - 1)
  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load messages.', error.code)
  }
  return { data: (data ?? []) as ContactMessageRow[], total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

async function markRead(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ status: 'READ' }).eq('id', id)
  if (error) throw new AppError('Could not update the message.', error.code)
}

export const messageService = { list, markRead }
