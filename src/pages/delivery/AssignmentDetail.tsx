import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { deliveryService } from '../../services/deliveryService'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { ASSIGNMENT_TYPE_LABEL, deliveryRoutes } from '../../lib/delivery'
import { CATEGORY_LABEL } from '../../lib/parcel'
import { formatDateTime, formatINR } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children}</dd>
    </div>
  )
}

export default function AssignmentDetail() {
  const { id = '' } = useParams()
  const validId = UUID.test(id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const { data, error, loading, reload } = useAsyncData(`assignment:${id}`, async () => {
    if (!validId) return null
    const item = await deliveryService.getAssignment(id)
    if (!item) return null
    const cash = item.assignment_type === 'PICKUP' ? await deliveryService.getCashDue(item.parcel.id) : null
    return { item, cash }
  })

  const back = (
    <Link to={deliveryRoutes.assignments} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to assignments
    </Link>
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold">Assignment not found</h1>
          <p className="mt-1 text-sm text-slate-600">{error ?? 'It does not exist or is not assigned to you.'}</p>
        </div>
      </div>
    )
  }

  const { item, cash } = data
  const parcel = item.parcel
  const isActive = item.status === 'ACTIVE'
  const isPickup = item.assignment_type === 'PICKUP'
  const canPickUp = isActive && isPickup && parcel.status === 'ASSIGNED'
  const canStart = isActive && !isPickup && (parcel.status === 'AT_DESTINATION_BRANCH' || parcel.status === 'DELIVERY_FAILED')
  const outForDelivery = isActive && !isPickup && parcel.status === 'OUT_FOR_DELIVERY'

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      reload()
    } catch (e) {
      setMessage(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function collectCash() {
    if (!cash) return
    if (!window.confirm(`Confirm that you collected ${formatINR(cash.amount)} in cash for ${parcel.tracking_number}?`)) return
    void run(() => deliveryService.markCashCollected(parcel.id))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{ASSIGNMENT_TYPE_LABEL[item.assignment_type]} assignment</p>
          <h1 className="font-mono text-2xl font-semibold">{parcel.tracking_number}</h1>
          <p className="mt-1 text-sm text-slate-600">Assigned {formatDateTime(item.assigned_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={parcel.status} />
          {!isActive && <span className="text-xs text-slate-500">Assignment {item.status.toLowerCase()}</span>}
        </div>
      </div>

      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      {(canPickUp || canStart || outForDelivery || cash) && (
        <section className="space-y-3 rounded-lg border border-brand-600/30 bg-brand-50 p-5">
          <h2 className="text-base font-semibold">Actions</h2>

          {canPickUp && (
            <div>
              <p className="mb-2 text-sm text-slate-700">Confirm only after you have physically collected the parcel.</p>
              <Button onClick={() => void run(() => deliveryService.markPickedUp(parcel.id))} loading={busy}>
                Mark as picked up
              </Button>
            </div>
          )}

          {cash && (
            <div>
              <p className="mb-2 text-sm text-slate-700">
                Cash on pickup: collect <strong>{formatINR(cash.amount)}</strong> from the sender.
              </p>
              <Button variant="secondary" onClick={collectCash} disabled={busy}>
                Record cash collected
              </Button>
            </div>
          )}

          {canStart && (
            <div>
              <p className="mb-2 text-sm text-slate-700">
                Starting the delivery marks the parcel out for delivery and gives the customer a delivery code.
              </p>
              <Button onClick={() => void run(() => deliveryService.startDelivery(parcel.id))} loading={busy}>
                Start delivery
              </Button>
            </div>
          )}

          {outForDelivery && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This parcel is out for delivery. Photo proof, code verification and failed-attempt recording are added in the next
              part (7B).
            </p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">{isPickup ? 'Pickup details' : 'Delivery details'}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {isPickup ? (
            <>
              <Row label="Sender">{parcel.sender_name}</Row>
              <Row label="Sender phone">
                <a href={`tel:${parcel.sender_phone}`} className="text-brand-700 hover:underline">
                  {parcel.sender_phone}
                </a>
              </Row>
              <Row label="Pickup address">{parcel.pickup_address}</Row>
            </>
          ) : (
            <>
              <Row label="Receiver">{parcel.receiver_name}</Row>
              <Row label="Receiver phone">
                <a href={`tel:${parcel.receiver_phone}`} className="text-brand-700 hover:underline">
                  {parcel.receiver_phone}
                </a>
              </Row>
              <Row label="Delivery address">
                {parcel.delivery_address}
                <span className="block font-normal text-slate-600">
                  {parcel.delivery_city} {parcel.delivery_pincode}
                </span>
              </Row>
            </>
          )}
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">Parcel</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Row label="Category">{CATEGORY_LABEL[parcel.category]}</Row>
          <Row label="Weight">{parcel.weight_kg} kg</Row>
        </dl>
        {parcel.description && <p className="mt-4 text-sm text-slate-700">Description: {parcel.description}</p>}
        {parcel.special_instructions && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Handling: {parcel.special_instructions}</p>
        )}
      </section>
    </div>
  )
}