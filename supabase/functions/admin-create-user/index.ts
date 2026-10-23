// Creates a staff (or admin) account. Only an active ADMIN may call it.
// The service-role key is used only here, on the server.
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

const ROLES = ['BRANCH_MANAGER', 'DELIVERY_PERSONNEL', 'ADMIN']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Please sign in.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Please sign in.' }, 401)
  const caller = userData.user

  // The caller must be an active administrator (a user can always read their own profile)
  const { data: me } = await userClient.from('profiles').select('role,is_active').eq('id', caller.id).maybeSingle()
  if (!me || me.role !== 'ADMIN' || !me.is_active) {
    return json({ error: 'Only administrators can create accounts.' }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const fullName = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const role = String(body.role ?? '')
  const branchId = body.branch_id ? String(body.branch_id) : null
  const password = String(body.password ?? '')

  if (fullName.length < 2 || fullName.length > 100) return json({ error: 'Enter the full name.' }, 400)
  if (!EMAIL.test(email) || email.length > 150) return json({ error: 'Enter a valid email address.' }, 400)
  if (phone !== '' && !/^[+]?[0-9]{10,13}$/.test(phone)) return json({ error: 'Enter a valid phone number.' }, 400)
  if (!ROLES.includes(role)) return json({ error: 'Choose a valid role.' }, 400)
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return json({ error: 'Password needs at least 8 characters, with a letter and a number.' }, 400)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  let finalBranch: string | null = null
  if (role !== 'ADMIN') {
    if (!branchId || !UUID.test(branchId)) return json({ error: 'Select a branch for staff accounts.' }, 400)
    const { data: branch } = await admin.from('branches').select('id,is_active').eq('id', branchId).maybeSingle()
    if (!branch || !branch.is_active) return json({ error: 'Select an active branch.' }, 400)
    finalBranch = branchId
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  })
  if (createError || !created.user) {
    const exists = createError?.code === 'email_exists' || /already/i.test(createError?.message ?? '')
    return json({ error: exists ? 'An account with this email already exists.' : 'The account could not be created.' }, exists ? 409 : 400)
  }
  const newId = created.user.id

  // The signup trigger created a CUSTOMER profile. Promote it (service role is trusted by the profile guard trigger).
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role, branch_id: finalBranch, full_name: fullName, phone: phone === '' ? null : phone })
    .eq('id', newId)
  if (profileError) {
    await admin.auth.admin.deleteUser(newId) // leave nothing half-created
    return json({ error: 'The profile could not be set up. Nothing was created.' }, 500)
  }

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'USER_CREATED',
    entity_type: 'profile',
    entity_id: newId,
    new_data: { email, role, branch_id: finalBranch },
  })

  return json({ ok: true, user_id: newId })
})
