import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  supabase,
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured,
} from '../../lib/supabaseClient'
import { ROUTES } from '../../app/routes'

type CheckState = 'pending' | 'ok' | 'fail'
interface Check {
  label: string
  state: CheckState
  detail?: string
}

export default function SetupCheck() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'Environment variables found', state: 'pending' },
    { label: 'Supabase client initialised', state: 'pending' },
    { label: 'Supabase Auth service reachable with your key', state: 'pending' },
  ])

  function update(index: number, patch: Partial<Check>) {
    setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  useEffect(() => {
    async function run() {
      // 1. Env vars
      if (!isSupabaseConfigured) {
        update(0, {
          state: 'fail',
          detail:
            'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local. Restart npm run dev after editing.',
        })
        update(1, { state: 'fail', detail: 'Skipped.' })
        update(2, { state: 'fail', detail: 'Skipped.' })
        return
      }
      update(0, {
        state: 'ok',
        detail: `${supabaseUrl} (key starts with ${supabasePublishableKey?.slice(0, 15)}...)`,
      })

      // 2. Client init
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        update(1, { state: 'ok', detail: 'No user is signed in yet (expected).' })
      } catch (e) {
        update(1, { state: 'fail', detail: (e as Error).message })
      }

      // 3. Real network call to the Auth service
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabasePublishableKey as string },
        })
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}. Check that the URL and publishable key are correct and from the same project.`,
          )
        }
        const settings = await res.json()
        let detail = 'Auth service responded.'
        if (typeof settings?.mailer_autoconfirm === 'boolean') {
          detail += settings.mailer_autoconfirm
            ? ' Email confirmation is OFF (good for development).'
            : ' Email confirmation is ON. Turn it off in Authentication settings for easier testing.'
        }
        update(2, { state: 'ok', detail })
      } catch (e) {
        update(2, { state: 'fail', detail: (e as Error).message })
      }
    }
    run()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Setup check</h1>
      <p className="mt-1 text-sm text-slate-600">
        Developer page for confirming the frontend can reach Supabase. It will be removed
        before final submission.
      </p>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {checks.map((c) => (
          <li key={c.label} className="flex gap-3 p-4">
            <span className="mt-0.5">
              {c.state === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
              {c.state === 'ok' && <CheckCircle2 className="h-5 w-5 text-brand-600" />}
              {c.state === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{c.label}</p>
              {c.detail && <p className="mt-0.5 break-words text-sm text-slate-600">{c.detail}</p>}
            </div>
          </li>
        ))}
      </ul>

      <Link to={ROUTES.home} className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">
        Back to home
      </Link>
    </div>
  )
}