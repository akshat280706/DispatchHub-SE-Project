// DEVELOPMENT ONLY. Simulates a payment result. No real money is processed.
// Refuses to run unless the secret DEV_PAYMENTS_ENABLED is exactly "true".
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  if (Deno.env.get('DEV_PAYMENTS_ENABLED') !== 'true') {
    return json({ error: 'Development payments are disabled on this server.' }, 403)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Please sign in.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Who is calling? (uses the caller's own token)
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Please sign in.' }, 401)

  let body: { payment_id?: string; outcome?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  const paymentId = body.payment_id ?? ''
  const outcome = body.outcome
  if (!UUID.test(paymentId) || (outcome !== 'SUCCESS' && outcome !== 'FAILED')) {
    return json({ error: 'Invalid request.' }, 400)
  }

  // Row Level Security means a customer can only see their own payments here
  const { data: pay, error: payError } = await userClient
    .from('payments')
    .select('id, customer_id, method, status')
    .eq('id', paymentId)
    .maybeSingle()
  if (payError || !pay || pay.customer_id !== userData.user.id) {
    return json({ error: 'Payment not found.' }, 404)
  }
  if (pay.method !== 'DEV_SIMULATED') return json({ error: 'This payment is not a development payment.' }, 400)
  if (pay.status !== 'PENDING') return json({ error: 'This payment was already processed.' }, 409)

  // Privileged step: only this server code can call apply_payment_result
  const admin = createClient(url, serviceKey)
  const reference = outcome === 'SUCCESS' ? `DEV-${crypto.randomUUID().slice(0, 12).toUpperCase()}` : null
  const { data, error } = await admin.rpc('apply_payment_result', {
    p_payment_id: paymentId,
    p_status: outcome,
    p_provider: 'dev',
    p_transaction_reference: reference,
    p_failure_reason: outcome === 'FAILED' ? 'Simulated payment failure' : null,
  })
  if (error) return json({ error: error.message }, 400)

  return json({ ok: true, result: data })
})