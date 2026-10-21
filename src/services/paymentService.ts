import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'

// Returns the id of the pending development payment, creating one when needed.
async function ensureAttempt(parcelId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_payment_attempt', { p_parcel_id: parcelId })
  if (error) throw rpcError(error, 'Could not start the payment. Please try again.')
  return data as string
}

// The result is applied on the server. This call only asks the server to simulate it.
async function simulate(paymentId: string, outcome: 'SUCCESS' | 'FAILED'): Promise<void> {
  const { error } = await supabase.functions.invoke('dev-payment-simulate', {
    body: { payment_id: paymentId, outcome },
  })
  if (error) {
    let message = 'The payment could not be processed. Please try again.'
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

export const paymentService = { ensureAttempt, simulate }
