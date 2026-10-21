import { supabase } from '../lib/supabaseClient'
import { rpcError } from '../lib/rpc'

export interface DevDeliveryOtp {
  otp: string
  expires_at: string
  attempts_left: number
  notice: string
}

// Returns null unless development mode is on and the parcel is out for delivery.
async function getDevOtp(parcelId: string): Promise<DevDeliveryOtp | null> {
  const { data, error } = await supabase.rpc('get_dev_delivery_otp', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not load the delivery code.')
  return (data as DevDeliveryOtp | null) ?? null
}

export const deliveryService = { getDevOtp }
