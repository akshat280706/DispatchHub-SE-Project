import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { AppNotification, NotificationType, Paged } from '../types/database'

export interface NotificationFilters {
  unreadOnly: boolean
  type: NotificationType | ''
  page: number
  pageSize: number
}

export const NOTIFICATIONS_CHANGED = 'dispatchhub:notifications-changed'

// Tells the header bell to refresh its count.
export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}

const COLUMNS = 'id,type,title,message,parcel_id,is_read,created_at'

// Row Level Security limits every query here to the signed-in user's own notifications.
async function listRecent(limit = 5): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new AppError('Could not load notifications.', error.code)
  return (data ?? []) as AppNotification[]
}

async function list(f: NotificationFilters): Promise<Paged<AppNotification>> {
  let q = supabase.from('notifications').select(COLUMNS, { count: 'exact' })
  if (f.unreadOnly) q = q.eq('is_read', false)
  if (f.type) q = q.eq('type', f.type)
  const start = (f.page - 1) * f.pageSize
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(start, start + f.pageSize - 1)
  if (error) {
    if (error.code === 'PGRST103') return { data: [], total: 0, page: f.page, pageSize: f.pageSize }
    throw new AppError('Could not load notifications.', error.code)
  }
  return { data: (data ?? []) as AppNotification[], total: count ?? 0, page: f.page, pageSize: f.pageSize }
}

async function unreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) throw new AppError('Could not load notifications.', error.code)
  return count ?? 0
}

async function markRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids)
  if (error) throw new AppError('Could not mark the notification as read.', error.code)
}

async function markAllRead(): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  if (error) throw new AppError('Could not mark notifications as read.', error.code)
}

export const notificationService = { listRecent, list, unreadCount, markRead, markAllRead }
