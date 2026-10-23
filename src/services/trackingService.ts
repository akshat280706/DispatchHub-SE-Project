import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { PublicTracking } from '../types/tracking'

export function normalizeTrackingNumber(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase()
}

export function isValidTrackingNumber(value: string): boolean {
  return /^[A-Z0-9]{6,30}$/.test(value)
}

// Calls the public track_parcel() database function. Returns null when nothing matches.
async function track(trackingNumber: string): Promise<PublicTracking | null> {
  const { data, error } = await supabase.rpc('track_parcel', { p_tracking_number: trackingNumber })
  if (error) throw new AppError('We could not look up this parcel right now. Please try again.', error.code)
  if (data && typeof data === 'object' && 'rate_limited' in data) {
    throw new AppError('Too many lookups from your connection. Please wait a few minutes and try again.', 'rate_limited')
  }
  return (data as PublicTracking | null) ?? null
}

export const trackingService = { track }