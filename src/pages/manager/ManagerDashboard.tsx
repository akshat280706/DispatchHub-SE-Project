import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { PARCEL_STATUSES } from '../../lib/constants'
import { managerRoutes } from '../../lib/manager'
import { formatDate, formatStatus } from '../../lib/format'

export default function ManagerDashboard() {
  const { profile } = useAuth()
  const { data, error, loading } = useAsyncData('manager-dashboard', () => reportService.branch())

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {profile?.full_name}</h1>
          <p className="text-sm text-slate-600">
            {data ? `${data.branch.name} (${data.branch.code}), ${data.branch.city}` : 'Your branch overview'}
          </p>
        </div>
        <Link
          to={managerRoutes.assign}
          className="inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open work queue
        </Link>
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
            <StatCard label="Branch parcels" value={data.parcel_count} hint={`${formatDate(data.from)} to ${formatDate(data.to)}`} />
            <StatCard label="Pending assignments" value={data.pending_assignments} hint="Right now" />
            <StatCard label="In transit" value={data.in_transit} hint="Right now" />
            <StatCard label="Delayed" value={data.delayed} hint="Past the estimated date" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Parcels by status</h2>
              {Object.keys(data.by_status).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No parcels in this period.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {PARCEL_STATUSES.filter((s) => data.by_status[s]).map((s) => (
                    <li key={s} className="flex justify-between">
                      <span className="text-slate-600">{formatStatus(s)}</span>
                      <span className="font-medium">{data.by_status[s]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Delivery personnel</h2>
              {data.personnel.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No active delivery personnel in this branch.</p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm">
                  {data.personnel.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{p.full_name}</p>
                        <p className="text-xs text-slate-500">{p.active_assignments} active assignment(s)</p>
                      </div>
                      <span className={`text-xs font-medium ${p.is_available ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {p.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Complaints</h2>
              {Object.keys(data.complaints).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No complaints on this branch's parcels.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].filter((s) => data.complaints[s]).map((s) => (
                    <li key={s} className="flex justify-between">
                      <span className="text-slate-600">{formatStatus(s)}</span>
                      <span className="font-medium">{data.complaints[s]}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to={managerRoutes.complaints} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                Review complaints
              </Link>            </section>
          </div>
        </>
      )}
    </div>
  )
}