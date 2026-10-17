import { createClient } from '@supabase/supabase-js'

export const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
export const supabasePublishableKey: string | undefined =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase env vars missing. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart `npm run dev`.',
  )
}

// Placeholders keep the app from crashing so /setup-check can explain the problem.
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabasePublishableKey ?? 'missing-key',
)