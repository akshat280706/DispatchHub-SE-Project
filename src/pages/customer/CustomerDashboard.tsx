import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import { parcelService } from '../../services/parcelService'
import { branchService } from '../../services/branchService'
import { notificationService } from '../../services/notificationService'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { customerRoutes } from '../../lib/parcel'
import { formatDate, formatDateTime, formatINR } from '../../lib/format'

export default function CustomerDashboard() {
  const { profile } = useAuth()
  const { data, error, loading } = useAsyncData('customer-dashboard', async () => {
    const [stats, recent, branches, notifications] = await Promise.all([
      reportService.customer(),
      parcelService.listRecent(5),
      branchService.listActive(),
      notificationService.listRecent(5),
    ])
    return { stats, recent, branches, notifications }
  })

  const bookButton = (
    <Link
      to={customerRoutes.book}
      className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
    >
      <Plus className="h-4 w-4" aria-hidden="true" /> Book a parcel
    </Link>
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {profile?.full_name}</h1>
          <p className="text-sm text-slate-600">Here is where your parcels stand.</p>
        </div>
        {bookButton}
      </div>

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
            <StatCard label="Total bookings" value={data.stats.total_bookings} />
            <StatCard label="Active shipments" value={data.stats.active_shipments} />
            <StatCard label="Delivered" value={data.stats.delivered} />
            <StatCard label="Unread notifications" value={data.stats.unread_notifications} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Recent bookings</h2>
                <Link to={customerRoutes.bookings} className="text-sm font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>              {data.recent.length === 0 ? (
                <EmptyState
                  title="No bookings yet"
                  text="Book your first parcel to see it here with live tracking history."
                  action={bookButton}
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-4 py-3">Tracking number</th>
                        <th scope="col" className="px-4 py-3">Route</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3 text-right">Total</th>
                        <th scope="col" className="px-4 py-3">Booked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.recent.map((p) => {
                        const from = data.branches.find((b) => b.id === p.origin_branch_id)?.city ?? '-'
                        const to = data.branches.find((b) => b.id === p.destination_branch_id)?.city ?? '-'
                        return (
                          <tr key={p.id}>
                            <td className="px-4 py-3">
                              <Link to={customerRoutes.booking(p.id)} className="font-mono font-medium text-brand-700 hover:underline">
                                {p.tracking_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {from} to {to}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={p.status} />
                            </td>
                            <td className="px-4 py-3 text-right">{formatINR(p.total_amount)}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(p.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Recent notifications</h2>
                <Link to="/app/customer/notifications" className="text-sm font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>              {data.notifications.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  Nothing yet. Updates about your parcels will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {data.notifications.map((n) => (
                    <li key={n.id} className="p-4">
                      <div className="flex items-start gap-2">
                        {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(n.created_at)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}