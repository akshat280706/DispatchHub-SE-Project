import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { complaintService } from '../../services/complaintService'
import type { ComplaintItem } from '../../services/complaintService'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime, formatStatus } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { ComplaintStatus } from '../../types/database'

const PAGE_SIZE = 10
const STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']

interface ReviewDialogProps {
  item: ComplaintItem
  onClose: () => void
  onChanged: () => void
}

function ReviewDialog({ item, onClose, onChanged }: ReviewDialogProps) {
  const [notes, setNotes] = useState(item.resolution_notes ?? '')
  const [busy, setBusy] = useState<ComplaintStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function move(next: ComplaintStatus) {
    if (next === 'RESOLVED' && notes.trim().length < 3) {
      setError('Resolution notes are required to resolve a complaint (at least 3 characters).')
      return
    }
    setBusy(next)
    setError(null)
    try {
      await complaintService.update(item.id, next, next === 'RESOLVED' ? notes.trim() : null)
      onChanged()
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(null)
    }
  }

  const s = item.status
  return (
    <Modal open title={item.complaint_number} onClose={() => (busy ? undefined : onClose())}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{item.subject}</h3>
          <StatusBadge status={s} />
        </div>
        <p className="text-sm text-slate-700">{item.description}</p>
        <p className="text-xs text-slate-500">
          Parcel <span className="font-mono font-medium">{item.parcel?.tracking_number ?? '-'}</span>
          {item.parcel?.sender_name ? ` · sender ${item.parcel.sender_name}` : ''} · raised {formatDateTime(item.created_at)}
        </p>

        {s === 'IN_REVIEW' && (
          <Textarea
            label="Resolution notes (shown to the customer)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
        {s !== 'IN_REVIEW' && item.resolution_notes && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <span className="font-medium">Resolution:</span> {item.resolution_notes}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy !== null}>
            Close
          </Button>
          {s === 'OPEN' && (
            <Button onClick={() => void move('IN_REVIEW')} loading={busy === 'IN_REVIEW'}>
              Start review
            </Button>
          )}
          {s === 'IN_REVIEW' && (
            <Button onClick={() => void move('RESOLVED')} loading={busy === 'RESOLVED'}>
              Mark resolved
            </Button>
          )}
          {s === 'RESOLVED' && (
            <>
              <Button variant="secondary" onClick={() => void move('IN_REVIEW')} loading={busy === 'IN_REVIEW'}>
                Reopen for review
              </Button>
              <Button onClick={() => void move('CLOSED')} loading={busy === 'CLOSED'}>
                Close complaint
              </Button>
            </>
          )}
        </div>
        {s === 'CLOSED' && <p className="text-xs text-slate-500">Closed complaints cannot be changed.</p>}
      </div>
    </Modal>
  )
}

export default function ManagerComplaints() {
  const [status, setStatus] = useState<ComplaintStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ComplaintItem | null>(null)
  const list = useAsyncData(`manager-complaints:${status}:${page}`, () =>
    complaintService.listForReview({ status, page, pageSize: PAGE_SIZE }),
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Complaints</h1>
        <p className="mt-1 text-sm text-slate-600">Complaints about parcels that start or end at your branch.</p>
      </div>

      <div className="max-w-xs">
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ComplaintStatus | '')
            setPage(1)
          }}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatus(s)}
            </option>
          ))}
        </Select>
      </div>

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
        <EmptyState title="No complaints" text={status ? 'Nothing with this status.' : 'Nothing has been raised for your branch.'} />
      )}
      {list.data && list.data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Complaint</th>
                  <th scope="col" className="px-4 py-3">Parcel</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Raised</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.data.data.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-500">{c.complaint_number}</p>
                      <p className="font-medium">{c.subject}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.parcel?.tracking_number ?? '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => setSelected(c)}>
                        {c.status === 'CLOSED' ? 'View' : 'Review'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
        </>
      )}

      {selected && (
        <ReviewDialog
          key={selected.id + selected.status}
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null)
            list.reload()
          }}
        />
      )}
    </div>
  )
}