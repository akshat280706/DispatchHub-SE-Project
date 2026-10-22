import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { deliveryService } from '../../services/deliveryService'
import type { HistoryFilters } from '../../services/deliveryService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { ASSIGNMENT_TYPE_LABEL, deliveryRoutes } from '../../lib/delivery'
import { formatDateTime } from '../../lib/format'
import type { AssignmentType, Paged } from '../../types/database'
import type { AssignmentItem } from '../../services/deliveryService'

const PAGE_SIZE = 10
const EMPTY: Paged<AssignmentItem> = { data: [], total: 0, page: 1, pageSize: PAGE_SIZE }

export default function DeliveryHistory() {
  const [type, setType] = useState<AssignmentType | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const rangeInvalid = from !== '' && to !== '' && from > to
  const hasFilters = type !== '' || from !== '' || to !== ''
  const filters: HistoryFilters = { type, from, to, page, pageSize: PAGE_SIZE }

  const list = useAsyncData(`delivery-history:${JSON.stringify(filters)}:${rangeInvalid}`, async () =>
    rangeInvalid ? EMPTY : deliveryService.listHistory(filters),
  )

  function clearFilters() {
    setType('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">History</h1>
      <p className="mt-1 text-sm text-slate-600">Pickups and deliveries you have finished.</p>

      <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Select
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as AssignmentType | '')
            setPage(1)
          }}
        >
          <option value="">All</option>
          <option value="PICKUP">Pickups</option>
          <option value="DELIVERY">Deliveries</option>
        </Select>
        <Input
          label="Finished from"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
        />
        <Input
          label="Finished to"
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {rangeInvalid && (
        <p role="alert" className="mt-3 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          The start date must be on or before the end date.
        </p>
      )}
      {hasFilters && (
        <div className="mt-3">
          <Button variant="ghost" onClick={clearFilters}>
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
        {list.data && list.data.data.length === 0 && !rangeInvalid && (
          <EmptyState
            title={hasFilters ? 'Nothing matches your filters' : 'No finished work yet'}
            text={hasFilters ? 'Try a different type or date range.' : 'Completed pickups and deliveries will appear here.'}
          />
        )}
        {list.data && list.data.data.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tracking number</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Parcel status</th>
                    <th scope="col" className="px-4 py-3">Finished</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {list.data.data.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <Link to={deliveryRoutes.assignment(a.id)} className="font-mono font-medium text-brand-700 hover:underline">
                          {a.parcel.tracking_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ASSIGNMENT_TYPE_LABEL[a.assignment_type]}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.parcel.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(a.completed_at)}</td>
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