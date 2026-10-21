import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { AppNotification } from '../types/database'

async function listRecent(limit = 5): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,type,title,message,parcel_id,is_read,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new AppError('Could not load notifications.', error.code)
  return (data ?? []) as AppNotification[]
}

export const notificationService = { listRecent }