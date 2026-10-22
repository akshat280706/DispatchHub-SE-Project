import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { managerService } from '../../services/managerService'
import { parcelService } from '../../services/parcelService'
import { deliveryService } from '../../services/deliveryService'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import TrackingTimeline from '../../components/domain/TrackingTimeline'
import AssignDialog from '../../components/domain/AssignDialog'
import ReasonDialog from '../../components/domain/ReasonDialog'
import { managerRoutes } from '../../lib/manager'
import { CATEGORY_LABEL, PAYMENT_METHOD_LABEL, ZONE_LABEL } from '../../lib/parcel'
import { ASSIGNMENT_TYPE_LABEL } from '../../lib/delivery'
import { formatDate, formatDateTime, formatINR } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { AssignmentType } from '../../types/database'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children}</dd>
    </div>
  )
}

export default function ManagerParcelDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const validId = UUID.test(id)
  const { data, error, loading, reload } = useAsyncData(`manager-parcel:${id}`, async () => (validId ? managerService.getDetail(id) : null))

  const [assignType, setAssignType] = useState<AssignmentType | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const back = (
    <Link to={managerRoutes.parcels} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to parcels
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
          <h1 className="text-lg font-semibold">Parcel not found</h1>
          <p className="mt-1 text-sm text-slate-600">{error ?? 'It does not exist or is not handled by your branch.'}</p>
        </div>
      </div>
    )
  }

  const { parcel, origin, destination, events, payments, assignments } = data
  const branchId = profile?.branch_id ?? null
  const isOrigin = branchId !== null && parcel.origin_branch_id === branchId
  const isDest = branchId !== null && parcel.destination_branch_id === branchId
  const s = parcel.status

  const activePickup = assignments.find((a) => a.status === 'ACTIVE' && a.assignment_type === 'PICKUP') ?? null
  const activeDelivery = assignments.find((a) => a.status === 'ACTIVE' && a.assignment_type === 'DELIVERY') ?? null
  const pendingCash = payments.find((p) => p.method === 'CASH_ON_PICKUP' && p.status === 'PENDING') ?? null

  const canAssignPickup = isOrigin && (s === 'CONFIRMED' || s === 'ASSIGNED')
  const canDispatch = isOrigin && s === 'PICKED_UP'
  const canConfirmArrival = isDest && s === 'IN_TRANSIT'
  const canAssignDelivery = isDest && (s === 'AT_DESTINATION_BRANCH' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERY_FAILED')
  const canReturn = isDest && s === 'DELIVERY_FAILED'
  const canCancel = s === 'BOOKED' || s === 'CONFIRMED' || s === 'ASSIGNED'
  const canRecordCash = isOrigin && pendingCash !== null && s !== 'CANCELLED'
  const hasActions = canAssignPickup || canDispatch || canConfirmArrival || canAssignDelivery || canReturn || canCancel || canRecordCash

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

  function recordCash() {
    if (!pendingCash) return
    if (!window.confirm(`Confirm that ${formatINR(pendingCash.amount)} cash was collected for ${parcel.tracking_number}?`)) return
    void run(() => deliveryService.markCashCollected(parcel.id))
  }

  function done() {
    setAssignType(null)
    reload()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {isOrigin ? 'Outgoing parcel' : 'Incoming parcel'}
          </p>
          <h1 className="font-mono text-2xl font-semibold">{parcel.tracking_number}</h1>
          <p className="mt-1 text-sm text-slate-600">Booked {formatDateTime(parcel.created_at)}</p>
        </div>
        <StatusBadge status={s} />
      </div>

      {s === 'CANCELLED' && parcel.cancelled_reason && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">Cancelled: {parcel.cancelled_reason}</p>
      )}
      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      {hasActions && (
        <section className="space-y-4 rounded-lg border border-brand-600/30 bg-brand-50 p-5">
          <h2 className="text-base font-semibold">Actions for your branch</h2>
          <div className="flex flex-wrap gap-3">
            {canAssignPickup && (
              <Button onClick={() => setAssignType('PICKUP')} disabled={busy}>
                {activePickup ? 'Reassign pickup' : 'Assign pickup'}
              </Button>
            )}
            {canDispatch && (
              <Button onClick={() => void run(() => managerService.updateStatus(parcel.id, 'IN_TRANSIT', null))} loading={busy}>
                Dispatch (in transit)
              </Button>
            )}
            {canConfirmArrival && (
              <Button onClick={() => void run(() => managerService.updateStatus(parcel.id, 'AT_DESTINATION_BRANCH', null))} loading={busy}>
                Confirm arrival at branch
              </Button>
            )}
            {canAssignDelivery && (
              <Button onClick={() => setAssignType('DELIVERY')} disabled={busy}>
                {activeDelivery ? 'Reassign delivery' : 'Assign delivery'}
              </Button>
            )}
            {canReturn && (
              <Button variant="secondary" onClick={() => setReturnOpen(true)} disabled={busy}>
                Return to sender
              </Button>
            )}
            {canRecordCash && pendingCash && (
              <Button variant="secondary" onClick={recordCash} disabled={busy}>
                Record cash collected
              </Button>
            )}
            {canCancel && (
              <Button variant="secondary" onClick={() => setCancelOpen(true)} disabled={busy}>
                Cancel parcel
              </Button>
            )}
          </div>
          {s === 'OUT_FOR_DELIVERY' && (
            <p className="text-xs text-slate-600">
              Reassigning while out for delivery keeps the same delivery code. The new rider can verify it, and the old rider loses
              access.
            </p>
          )}
        </section>
      )}

      {!hasActions && (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
          There is no action for your branch at this stage ({s.toLowerCase().replace(/_/g, ' ')}).
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Shipment</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Row label="From">{origin ? `${origin.city} (${origin.name})` : '-'}</Row>
              <Row label="To">{destination ? `${destination.city} (${destination.name})` : '-'}</Row>
              <Row label="Category">{CATEGORY_LABEL[parcel.category]}</Row>
              <Row label="Weight">{parcel.weight_kg} kg</Row>
              <Row label="Zone">{ZONE_LABEL[parcel.zone]}</Row>
              {parcel.estimated_delivery_date && !['DELIVERED', 'RETURNED', 'CANCELLED'].includes(s) && (
                <Row label="Estimated delivery">{formatDate(parcel.estimated_delivery_date)}</Row>
              )}
            </dl>
            {parcel.description && <p className="mt-4 text-sm text-slate-700">Description: {parcel.description}</p>}
            {parcel.special_instructions && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Handling: {parcel.special_instructions}</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">People and addresses</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Row label="Sender">
                {parcel.sender_name}
                <span className="block font-normal text-slate-600">{parcel.sender_phone}</span>
              </Row>
              <Row label="Pickup address">{parcel.pickup_address}</Row>
              <Row label="Receiver">
                {parcel.receiver_name}
                <span className="block font-normal text-slate-600">{parcel.receiver_phone}</span>
              </Row>
              <Row label="Delivery address">
                {parcel.delivery_address}
                <span className="block font-normal text-slate-600">
                  {parcel.delivery_city} {parcel.delivery_pincode}
                </span>
              </Row>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold">Tracking history</h2>
            <TrackingTimeline events={events} />
            <p className="mt-4 text-xs text-slate-500">Staff notes shown here are not visible on public tracking.</p>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Assignments</h2>
            {assignments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No assignments yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200">
                {assignments.map((a) => (
                  <li key={a.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {ASSIGNMENT_TYPE_LABEL[a.assignment_type]}: {a.personnel_name}
                      </span>
                      <StatusBadge status={a.status === 'ACTIVE' ? 'ASSIGNED' : a.status === 'COMPLETED' ? 'DELIVERED' : 'CANCELLED'} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.status.charAt(0) + a.status.slice(1).toLowerCase()} · assigned {formatDateTime(a.assigned_at)}
                    </p>
                    {a.reassign_reason && <p className="mt-1 text-xs text-slate-600">Reason: {a.reassign_reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Charges and payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Shipping</dt>
                <dd>{formatINR(parcel.shipping_charge)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">GST</dt>
                <dd>{formatINR(parcel.tax_amount)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(parcel.total_amount)}</dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
              {payments.length === 0 && <li className="text-slate-600">No payment record.</li>}
              {payments.map((pm) => (
                <li key={pm.id} className="flex items-center justify-between gap-2">
                  <span>{PAYMENT_METHOD_LABEL[pm.method]}</span>
                  <StatusBadge status={pm.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {assignType && (
        <AssignDialog
          open
          parcelId={parcel.id}
          trackingNumber={parcel.tracking_number}
          type={assignType}
          currentPersonnelId={(assignType === 'PICKUP' ? activePickup : activeDelivery)?.personnel_id ?? null}
          onClose={() => setAssignType(null)}
          onDone={done}
        />
      )}

      <ReasonDialog
        open={returnOpen}
        title="Return parcel to sender?"
        description={<>Parcel <span className="font-mono font-medium">{parcel.tracking_number}</span> will be marked as returned. This is final.</>}
        label="Note for the record"
        confirmLabel="Return parcel"
        onClose={() => setReturnOpen(false)}
        onSubmit={async (text) => {
          await managerService.updateStatus(parcel.id, 'RETURNED', text)
          setReturnOpen(false)
          reload()
        }}
      />

      <ReasonDialog
        open={cancelOpen}
        title="Cancel this parcel?"
        description={
          <>
            Parcel <span className="font-mono font-medium">{parcel.tracking_number}</span> will be cancelled and the customer
            notified. A paid parcel is marked refunded in the records (no real money moves in development mode).
          </>
        }
        label="Reason for cancelling"
        confirmLabel="Cancel parcel"
        danger
        onClose={() => setCancelOpen(false)}
        onSubmit={async (text) => {
          await parcelService.cancel(parcel.id, text)
          setCancelOpen(false)
          reload()
        }}
      />
    </div>
  )
}