import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import TrackForm from '../../components/domain/TrackForm'
import TrackingTimeline from '../../components/domain/TrackingTimeline'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import { isValidTrackingNumber, normalizeTrackingNumber, trackingService } from '../../services/trackingService'
import { formatDate } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { PublicTracking } from '../../types/tracking'

interface Result {
  key: string
  data: PublicTracking | null
  error: string | null
}

export default function TrackParcel() {
  const params = useParams()
  const raw = params.trackingNumber ? decodeURIComponent(params.trackingNumber) : ''
  const normalized = normalizeTrackingNumber(raw)
  const valid = isValidTrackingNumber(normalized)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (!valid) return
    let active = true
    trackingService
      .track(normalized)
      .then((data) => active && setResult({ key: normalized, data, error: null }))
      .catch((e) => active && setResult({ key: normalized, data: null, error: getErrorMessage(e) }))
    return () => {
      active = false
    }
  }, [normalized, valid])

  const loading = valid && result?.key !== normalized
  const current = valid && result?.key === normalized ? result : null

  return (
    <>
      <PageHeader title="Track parcel" subtitle="Enter your tracking number to see the current status and history." />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <TrackForm key={normalized} initialValue={raw} />
        </div>

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-600" role="status">
            <Spinner /> Looking up your parcel...
          </div>
        )}

        {normalized !== '' && !valid && (
          <p role="alert" className="mt-8 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            That does not look like a tracking number. Use only letters and numbers, without spaces or symbols.
          </p>
        )}

        {current?.error && (
          <p role="alert" className="mt-8 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {current.error}
          </p>
        )}

        {current && !current.error && !current.data && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-center">
            <h2 className="text-lg font-semibold">No parcel found</h2>
            <p className="mt-1 text-sm text-slate-600">
              We could not find <span className="font-medium">{normalized}</span>. Check the number on your booking
              confirmation and try again.
            </p>
          </div>
        )}

        {current?.data && (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tracking number</p>
                  <p className="font-mono text-lg font-semibold">{current.data.tracking_number}</p>
                </div>
                <StatusBadge status={current.data.status} />
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">From</dt>
                  <dd className="font-medium">
                    {current.data.origin.city} ({current.data.origin.branch_name})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">To</dt>
                  <dd className="font-medium">
                    {current.data.destination.city} ({current.data.destination.branch_name})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Booked on</dt>
                  <dd className="font-medium">{formatDate(current.data.booked_at)}</dd>
                </div>
                {current.data.estimated_delivery_date && (
                  <div>
                    <dt className="text-slate-500">Estimated delivery</dt>
                    <dd className="font-medium">{formatDate(current.data.estimated_delivery_date)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Tracking history</h2>
              <TrackingTimeline events={current.data.events} />
            </div>

            <p className="text-xs text-slate-500">
              Public tracking shows status and branch cities only. Names, addresses and payment details are never shown.
              Updates are recorded when a branch or delivery partner scans a step, not from live GPS.
            </p>
          </div>
        )}
      </div>
    </>
  )
}