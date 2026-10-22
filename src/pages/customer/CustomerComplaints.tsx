import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { complaintService } from '../../services/complaintService'
import { parcelService } from '../../services/parcelService'
import type { ParcelSummary } from '../../services/parcelService'
import { complaintSchema } from '../../schemas/complaint'
import type { ComplaintInput } from '../../schemas/complaint'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { customerRoutes } from '../../lib/parcel'
import { formatDateTime, formatStatus } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { ComplaintStatus } from '../../types/database'

const PAGE_SIZE = 10
const STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']

interface ComplaintFormProps {
  parcels: ParcelSummary[]
  defaultParcelId: string
  onSubmit: (values: ComplaintInput) => Promise<void>
  onCancel: () => void
}

function ComplaintForm({ parcels, defaultParcelId, onSubmit, onCancel }: ComplaintFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintInput>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { parcel_id: defaultParcelId, subject: '', description: '' },
  })

  async function submit(values: ComplaintInput) {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold">Raise a complaint</h2>
      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <Select label="Parcel" error={errors.parcel_id?.message} {...register('parcel_id')}>
        <option value="">Select a parcel</option>
        {parcels.map((p) => (
          <option key={p.id} value={p.id}>
            {p.tracking_number} ({formatStatus(p.status)})
          </option>
        ))}
      </Select>
      <Input label="Subject" error={errors.subject?.message} {...register('subject')} />
      <Textarea label="What went wrong?" rows={5} error={errors.description?.message} {...register('description')} />
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>
          Send complaint
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function CustomerComplaints() {
  const { profile } = useAuth()
  const [params] = useSearchParams()
  const presetParcel = params.get('parcel') ?? ''
  const [formOpen, setFormOpen] = useState(presetParcel !== '')
  const [sentNumber, setSentNumber] = useState<string | null>(null)
  const [status, setStatus] = useState<ComplaintStatus | ''>('')
  const [page, setPage] = useState(1)

  const parcels = useAsyncData('complaint-parcels', () => parcelService.listRecent(100))
  const list = useAsyncData(`my-complaints:${status}:${page}`, () =>
    complaintService.listMine({ status, page, pageSize: PAGE_SIZE }),
  )

  async function send(values: ComplaintInput) {
    if (!profile) return
    const number = await complaintService.create(profile.id, values)
    setSentNumber(number)
    setFormOpen(false)
    setStatus('')
    setPage(1)
    list.reload()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Complaints</h1>
          <p className="text-sm text-slate-600">Raise a problem with one of your parcels and follow its progress.</p>
        </div>
        {!formOpen && (
          <Button onClick={() => { setSentNumber(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New complaint
          </Button>
        )}
      </div>

      {sentNumber && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Complaint {sentNumber} was sent. You will be notified when it is
          updated.
        </p>
      )}

      {formOpen && parcels.loading && (
        <div role="status">
          <Spinner />
        </div>
      )}
      {formOpen && parcels.error && <p className="text-sm text-red-700">{parcels.error}</p>}
      {formOpen && parcels.data && parcels.data.length === 0 && (
        <EmptyState title="No parcels to complain about" text="You can raise a complaint once you have booked a parcel." />
      )}
      {formOpen && parcels.data && parcels.data.length > 0 && (
        <ComplaintForm
          parcels={parcels.data}
          defaultParcelId={presetParcel}
          onSubmit={send}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <div className="max-w-xs">
        <Select
          label="Filter by status"
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
        <EmptyState
          title={status ? 'No complaints with this status' : 'No complaints yet'}
          text="If something goes wrong with a parcel, raise a complaint and the branch will look into it."
        />
      )}
      {list.data && list.data.data.length > 0 && (
        <>
          <ul className="space-y-4">
            {list.data.data.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-medium">{c.complaint_number}</p>
                    <h2 className="mt-1 text-base font-semibold">{c.subject}</h2>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-2 text-sm text-slate-700">{c.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Parcel{' '}
                  <Link to={customerRoutes.booking(c.parcel_id)} className="font-mono font-medium text-brand-700 hover:underline">
                    {c.parcel?.tracking_number ?? 'view'}
                  </Link>{' '}
                  · raised {formatDateTime(c.created_at)}
                  {c.resolved_at && ` · resolved ${formatDateTime(c.resolved_at)}`}
                </p>
                {c.resolution_notes && (
                  <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-medium">Resolution:</span> {c.resolution_notes}
                  </p>
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