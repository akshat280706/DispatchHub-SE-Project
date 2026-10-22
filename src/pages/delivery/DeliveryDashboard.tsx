import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import { deliveryService } from '../../services/deliveryService'
import { profileService } from '../../services/profileService'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { ASSIGNMENT_TYPE_LABEL, deliveryRoutes } from '../../lib/delivery'
import { formatDateTime } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

export default function DeliveryDashboard() {
  const { profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [availError, setAvailError] = useState<string | null>(null)

  const { data, error, loading } = useAsyncData('delivery-dashboard', async () => {
    const [stats, active] = await Promise.all([reportService.personnel(), deliveryService.listActive('')])
    return { stats, active }
  })

  async function toggleAvailability() {
    if (!profile) return
    setBusy(true)
    setAvailError(null)
    try {
      await profileService.setAvailability(profile.id, !profile.is_available)
      await refreshProfile()
    } catch (e) {
      setAvailError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {profile?.full_name}</h1>
          <p className="text-sm text-slate-600">Your pickups and deliveries.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${profile?.is_available ? 'text-emerald-700' : 'text-amber-700'}`}>
            {profile?.is_available ? 'Available for assignments' : 'Marked unavailable'}
          </span>
          <Button variant="secondary" onClick={() => void toggleAvailability()} loading={busy}>
            {profile?.is_available ? 'Set unavailable' : 'Set available'}
          </Button>
        </div>
      </div>

      {availError && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {availError}
        </p>
      )}

      {loading && (
        <div className="mt-10 flex justify-center" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active assignments" value={data.stats.assigned_total} />
            <StatCard label="Pending pickups" value={data.stats.pending_pickups} />
            <StatCard label="Out for delivery" value={data.stats.out_for_delivery} />
            <StatCard label="Completed deliveries" value={data.stats.completed_deliveries} hint={`${data.stats.completed_today} finished today`} />
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent assignments</h2>
              <Link to={deliveryRoutes.assignments} className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            </div>
            {data.active.length === 0 ? (
              <EmptyState title="Nothing assigned right now" text="New pickups and deliveries from your branch manager appear here." />
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {data.active.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link to={deliveryRoutes.assignment(a.id)} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50">
                      <div>
                        <p className="font-mono text-sm font-medium text-brand-700">{a.parcel.tracking_number}</p>
                        <p className="text-sm text-slate-600">
                          {ASSIGNMENT_TYPE_LABEL[a.assignment_type]}:{' '}
                          {a.assignment_type === 'PICKUP' ? a.parcel.sender_name : `${a.parcel.receiver_name}, ${a.parcel.delivery_city}`}
                        </p>
                        <p className="text-xs text-slate-500">Assigned {formatDateTime(a.assigned_at)}</p>
                      </div>
                      <StatusBadge status={a.parcel.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}