import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { ROLE_LABEL } from '../../lib/navigation'
import type { UserRole } from '../../types/database'

const BUILT_IN: Record<UserRole, string> = {
  CUSTOMER: 'Batch 5',
  DELIVERY_PERSONNEL: 'Batch 7',
  BRANCH_MANAGER: 'Batch 8',
  ADMIN: 'Batch 9',
}

export default function DashboardHome() {
  const { profile } = useAuth()
  const [visibleParcels, setVisibleParcels] = useState<number | null>(null)
  const [countError, setCountError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('parcels')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (!active) return
        if (error) setCountError(error.message)
        else setVisibleParcels(count ?? 0)
      })
    return () => {
      active = false
    }
  }, [])

  if (!profile) return null

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Welcome, {profile.full_name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        You are signed in as <strong>{ROLE_LABEL[profile.role]}</strong>. The full dashboard arrives in{' '}
        {BUILT_IN[profile.role]}.
      </p>

      <dl className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900">{profile.email}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium text-slate-900">{profile.role}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-slate-500">Parcels you are allowed to see</dt>
          <dd className="font-medium text-slate-900">
            {countError ? `Error: ${countError}` : visibleParcels === null ? '...' : visibleParcels}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        That last number is counted by the database under Row Level Security, so it differs per role. It is a
        temporary check and will be replaced by the real dashboards.
      </p>
    </div>
  )
}