import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { messageService } from '../../services/messageService'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

const PAGE_SIZE = 10

export default function AdminMessages() {
  const [status, setStatus] = useState<'' | 'NEW' | 'READ'>('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const list = useAsyncData(`contact-messages:${status}:${page}`, () => messageService.list({ status, page, pageSize: PAGE_SIZE }))

  async function markRead(id: string) {
    setMessage(null)
    try {
      await messageService.markRead(id)
      list.reload()
    } catch (e) {
      setMessage(getErrorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact messages</h1>
        <p className="mt-1 text-sm text-slate-600">Messages sent from the public Contact page.</p>
      </div>

      <div className="max-w-xs">
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | 'NEW' | 'READ')
            setPage(1)
          }}
        >
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
        </Select>
      </div>

      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
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
      {list.data && list.data.data.length === 0 && (
        <EmptyState title="No messages" text={status ? 'Nothing with this status.' : 'Nobody has written in yet.'} />
      )}
      {list.data && list.data.data.length > 0 && (
        <>
          <ul className="space-y-4">
            {list.data.data.map((m) => (
              <li key={m.id} className={`rounded-lg border bg-white p-5 ${m.status === 'NEW' ? 'border-brand-600/40' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">{m.subject}</h2>
                    <p className="text-sm text-slate-600">
                      {m.name} ·{' '}
                      <a href={`mailto:${m.email}`} className="text-brand-700 hover:underline">
                        {m.email}
                      </a>
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      m.status === 'NEW' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' : 'bg-slate-100 text-slate-700 ring-slate-500/20'
                    }`}
                  >
                    {m.status === 'NEW' ? 'New' : 'Read'}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.message}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{formatDateTime(m.created_at)}</p>
                  {m.status === 'NEW' && (
                    <Button variant="secondary" onClick={() => void markRead(m.id)}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
