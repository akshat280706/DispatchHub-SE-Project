import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebounce } from '../../hooks/useDebounce'
import { branchService } from '../../services/branchService'
import { managerService } from '../../services/managerService'
import type { ManagerFilters } from '../../services/managerService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PARCEL_STATUSES } from '../../lib/constants'
import { managerRoutes } from '../../lib/manager'
import { formatDate, formatINR, formatStatus } from '../../lib/format'
import type { ParcelStatus } from '../../types/database'

const PAGE_SIZE = 10

export default function ManagerParcels() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ParcelStatus | ''>('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search, 400)
  const hasFilters = search !== '' || status !== ''

  const branches = useAsyncData('branches', () => branchService.listActive())
  const filters: ManagerFilters = { search: debounced, status, page, pageSize: PAGE_SIZE }
  const list = useAsyncData(`manager-parcels:${JSON.stringify(filters)}`, () => managerService.listParcels(filters))

  const city = (id: string) => branches.data?.find((b) => b.id === id)?.city ?? '-'

  function clear() {
    setSearch('')
    setStatus('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Branch parcels</h1>
      <p className="mt-1 text-sm text-slate-600">Parcels that start or end at your branch.</p>

      <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Input
          label="Search"
          placeholder="Tracking number, sender or receiver"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ParcelStatus | '')
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {PARCEL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatus(s)}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters && (
        <div className="mt-3">
          <Button variant="ghost" onClick={clear}>
            Clear filters
          </Button>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {list.loading && (
          <div className="flex justify-center py-12" role="status">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {list.error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {list.error}
          </p>
        )}
        {list.data && list.data.data.length === 0 && (
          <EmptyState title={hasFilters ? 'No parcels match your filters' : 'No parcels yet'} text="Parcels for your branch appear here." />
        )}
        {list.data && list.data.data.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tracking number</th>
                    <th scope="col" className="px-4 py-3">Route</th>
                    <th scope="col" className="px-4 py-3">Receiver</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Total</th>
                    <th scope="col" className="px-4 py-3">Booked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {list.data.data.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <Link to={managerRoutes.parcel(p.id)} className="font-mono font-medium text-brand-700 hover:underline">
                          {p.tracking_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {city(p.origin_branch_id)} to {city(p.destination_branch_id)}
                        <span className="block text-xs text-slate-500">
                          {p.origin_branch_id === profile?.branch_id ? 'Outgoing' : 'Incoming'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.receiver_name}
                        <span className="block text-xs text-slate-500">{p.delivery_city}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">{formatINR(p.total_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
