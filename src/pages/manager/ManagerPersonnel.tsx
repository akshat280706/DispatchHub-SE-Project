import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { personnelService } from '../../services/personnelService'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { managerRoutes } from '../../lib/manager'
import { ASSIGNMENT_TYPE_LABEL } from '../../lib/delivery'
import { formatDateTime } from '../../lib/format'

export default function ManagerPersonnel() {
  const { data, error, loading } = useAsyncData('manager-personnel', () => personnelService.overview())

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Delivery personnel</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your branch's riders, their workload and availability. Riders set their own availability from their dashboard.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {data && data.length === 0 && (
        <EmptyState title="No delivery personnel" text="No active delivery personnel belong to your branch yet." />
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{p.full_name}</h2>
                  <p className="text-sm text-slate-600">{p.phone ?? 'No phone on file'}</p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>
                <span className={`text-xs font-medium ${p.is_available ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {p.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-slate-500">Active</dt>
                  <dd className="text-xl font-semibold">{p.active.length}</dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-slate-500">Completed</dt>
                  <dd className="text-xl font-semibold">{p.completed}</dd>
                </div>
              </dl>

              <h3 className="mt-4 text-sm font-medium">Current assignments</h3>
              {p.active.length === 0 ? (
                <p className="mt-1 text-sm text-slate-600">None right now.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-200 text-sm">
                  {p.active.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <Link to={managerRoutes.parcel(a.parcel.id)} className="font-mono font-medium text-brand-700 hover:underline">
                          {a.parcel.tracking_number}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {ASSIGNMENT_TYPE_LABEL[a.assignment_type]} · {formatDateTime(a.assigned_at)}
                        </p>
                      </div>
                      <StatusBadge status={a.parcel.status} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}