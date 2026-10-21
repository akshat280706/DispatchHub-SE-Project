import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebounce } from '../../hooks/useDebounce'
import { branchService } from '../../services/branchService'
import { parcelService } from '../../services/parcelService'
import type { ParcelFilters, ParcelListItem } from '../../services/parcelService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PARCEL_STATUSES } from '../../lib/constants'
import { customerRoutes } from '../../lib/parcel'
import { formatDate, formatINR, formatStatus } from '../../lib/format'
import type { Paged, ParcelStatus } from '../../types/database'

const PAGE_SIZE = 10
const EMPTY: Paged<ParcelListItem> = { data: [], total: 0, page: 1, pageSize: PAGE_SIZE }

export default function MyBookings() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ParcelStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 400)
  const rangeInvalid = from !== '' && to !== '' && from > to
  const hasFilters = search !== '' || status !== '' || from !== '' || to !== ''

  const branches = useAsyncData('branches', () => branchService.listActive())
  const filters: ParcelFilters = { search: debouncedSearch, status, from, to, page, pageSize: PAGE_SIZE }
  const list = useAsyncData(`my-bookings:${JSON.stringify(filters)}:${rangeInvalid}`, async () =>
    rangeInvalid ? EMPTY : parcelService.listMine(filters),
  )

  const city = (id: string) => branches.data?.find((b) => b.id === id)?.city ?? '-'

  function clearFilters() {
    setSearch('')
    setStatus('')
    setFrom('')
    setTo('')
    setPage(1)
  }

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
          <h1 className="text-2xl font-semibold">My bookings</h1>
          <p className="text-sm text-slate-600">Search and filter every parcel you have booked.</p>
        </div>
        {bookButton}
      </div>

      <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          placeholder="Tracking number or receiver"
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
        <Input
          label="Booked from"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
        />
        <Input
          label="Booked to"
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
            title={hasFilters ? 'No bookings match your filters' : 'No bookings yet'}
            text={
              hasFilters
                ? 'Try a different search or clear the filters.'
                : 'Book your first parcel and it will appear here.'
            }
            action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : bookButton}
          />
        )}

        {list.data && list.data.data.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                        <Link to={customerRoutes.booking(p.id)} className="font-mono font-medium text-brand-700 hover:underline">
                          {p.tracking_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {city(p.origin_branch_id)} to {city(p.destination_branch_id)}
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