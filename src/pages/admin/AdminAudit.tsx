import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebounce } from '../../hooks/useDebounce'
import { adminConfigService } from '../../services/adminConfigService'
import type { AuditFilters } from '../../services/adminConfigService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime } from '../../lib/format'

const PAGE_SIZE = 15
const ENTITIES = ['profile', 'parcel', 'payment', 'complaint', 'branch', 'shipping_rate', 'system_setting']

function Json({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-800">{JSON.stringify(value, null, 2)}</pre>
    </div>
  )
}

export default function AdminAudit() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const debouncedAction = useDebounce(action, 400)
  const rangeInvalid = from !== '' && to !== '' && from > to
  const hasFilters = entity !== '' || action !== '' || from !== '' || to !== ''
  const filters: AuditFilters = { entity, action: debouncedAction, from, to, page, pageSize: PAGE_SIZE }

  const list = useAsyncData(`audit:${JSON.stringify(filters)}:${rangeInvalid}`, async () =>
    rangeInvalid ? { data: [], total: 0, page: 1, pageSize: PAGE_SIZE } : adminConfigService.listAudit(filters),
  )

  function clear() {
    setEntity('')
    setAction('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">
          A read-only record of sensitive changes. Entries cannot be edited or deleted.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Entity" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1) }}>
          <option value="">All</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <Input label="Action contains" placeholder="e.g. USER" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} />
        <Input label="From" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        <Input label="To" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
      </div>
      {rangeInvalid && (
        <p role="alert" className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          The start date must be on or before the end date.
        </p>
      )}
      {hasFilters && (
        <Button variant="ghost" onClick={clear}>
          Clear filters
        </Button>
      )}

      {list.loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {list.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {list.error}
        </p>
      )}
      {list.data && list.data.data.length === 0 && !rangeInvalid && (
        <EmptyState title={hasFilters ? 'No entries match your filters' : 'No audit entries yet'} text="Changes such as user edits and cancellations are recorded here." />
      )}
      {list.data && list.data.data.length > 0 && (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {list.data.data.map((a) => (
              <li key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{a.action}</p>
                    <p className="text-sm text-slate-600">
                      {a.entity_type}
                      {a.entity_id ? ` · ${a.entity_id}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-700">{a.actor ? `${a.actor.full_name} (${a.actor.email})` : 'System'}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(a.created_at)}</p>
                  </div>
                </div>
                {(a.old_data !== null || a.new_data !== null) && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-brand-700">Details</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Json label="Before" value={a.old_data} />
                      <Json label="After" value={a.new_data} />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
