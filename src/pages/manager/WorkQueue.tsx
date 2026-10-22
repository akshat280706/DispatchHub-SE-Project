import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { branchService } from '../../services/branchService'
import { managerService } from '../../services/managerService'
import type { ManagerParcelItem } from '../../services/managerService'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { managerRoutes } from '../../lib/manager'
import { formatDate } from '../../lib/format'

function Section({
  title,
  help,
  items,
  city,
}: {
  title: string
  help: string
  items: ManagerParcelItem[]
  city: (id: string) => string
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {title} <span className="text-sm font-normal text-slate-500">({items.length})</span>
        </h2>
      </div>
      <p className="mb-3 text-sm text-slate-600">{help}</p>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">Nothing waiting here.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {items.map((p) => (
            <li key={p.id}>
              <Link to={managerRoutes.parcel(p.id)} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50">
                <div>
                  <p className="font-mono text-sm font-medium text-brand-700">{p.tracking_number}</p>
                  <p className="text-sm text-slate-600">
                    {city(p.origin_branch_id)} to {city(p.destination_branch_id)} · {p.receiver_name}
                  </p>
                  <p className="text-xs text-slate-500">Booked {formatDate(p.created_at)}</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function WorkQueue() {
  const { profile } = useAuth()
  const branchId = profile?.branch_id ?? ''
  const branches = useAsyncData('branches', () => branchService.listActive())
  const queue = useAsyncData(`work-queue:${branchId}`, () => managerService.getQueue(branchId))
  const city = (id: string) => branches.data?.find((b) => b.id === id)?.city ?? '-'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Assign and dispatch</h1>
        <p className="mt-1 text-sm text-slate-600">Parcels waiting for a decision from your branch. Open one to act on it.</p>
      </div>

      {queue.loading && (
        <div className="flex justify-center py-12" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {queue.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {queue.error}
        </p>
      )}

      {queue.data && (
        <>
          <Section title="Awaiting pickup assignment" help="Confirmed parcels leaving your branch that need a pickup rider." items={queue.data.pickups} city={city} />
          <Section title="Ready to dispatch" help="Picked up by a rider. Dispatch them to start the journey between branches." items={queue.data.dispatch} city={city} />
          <Section title="Arriving at your branch" help="In transit to you. Confirm arrival when they reach the branch." items={queue.data.arrivals} city={city} />
          <Section title="Awaiting delivery assignment" help="At your branch (or a failed attempt) with no delivery rider yet." items={queue.data.deliveries} city={city} />
        </>
      )}
    </div>
  )
}