import { Link, useLocation, useParams } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { parcelService } from '../../services/parcelService'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import TrackingTimeline from '../../components/domain/TrackingTimeline'
import Button from '../../components/ui/Button'
import CancelParcelDialog from '../../components/domain/CancelParcelDialog'
import { CATEGORY_LABEL, PAYMENT_METHOD_LABEL, ZONE_LABEL, customerRoutes } from '../../lib/parcel'
import { trackRoute } from '../../app/routes'
import { formatDate, formatDateTime, formatINR } from '../../lib/format'
import DeliveryCodeCard from '../../components/domain/DeliveryCodeCard'


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children}</dd>
    </div>
  )
}

export default function BookingDetail() {
  const { id = '' } = useParams()
  const location = useLocation()
  const justBooked = Boolean((location.state as { justBooked?: boolean } | null)?.justBooked)
  const validId = UUID.test(id)

  const { data, error, loading, reload } = useAsyncData(`parcel:${id}`, async () => (validId ? parcelService.getById(id) : null))
  const [cancelOpen, setCancelOpen] = useState(false)

  const back = (
    <Link to={customerRoutes.dashboard} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
    </Link>
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold">Booking not found</h1>
          <p className="mt-1 text-sm text-slate-600">It may not exist, or it belongs to another account.</p>
        </div>
      </div>
    )
  }

  const { parcel, origin, destination, events, payments } = data
  const latestPayment = payments[0]
  const hasDims = parcel.length_cm !== null || parcel.width_cm !== null || parcel.height_cm !== null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {back}

      {justBooked && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Booking received
          </div>
          <p className="mt-1">
            Your tracking number is <span className="font-mono font-semibold">{parcel.tracking_number}</span>. Keep it to track
            this parcel.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Tracking number</p>
          <h1 className="font-mono text-2xl font-semibold">{parcel.tracking_number}</h1>
          <p className="mt-1 text-sm text-slate-600">Booked on {formatDateTime(parcel.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={parcel.status} />
          {(parcel.status === 'BOOKED' || parcel.status === 'CONFIRMED') && (
            <Button variant="secondary" onClick={() => setCancelOpen(true)}>
              Cancel booking
            </Button>
          )}
          <CancelParcelDialog
            open={cancelOpen}
            parcelId={parcel.id}
            trackingNumber={parcel.tracking_number}
            onClose={() => setCancelOpen(false)}
            onCancelled={() => {
              setCancelOpen(false)
              reload()
            }}
          />
          <Link to={trackRoute(parcel.tracking_number)} className="text-sm font-medium text-brand-700 hover:underline">
            Open public tracking page
          </Link>
        </div>
      </div>

      {parcel.status === 'CANCELLED' && parcel.cancelled_reason && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">Cancelled: {parcel.cancelled_reason}</p>
      )}

      {parcel.status === 'OUT_FOR_DELIVERY' && <DeliveryCodeCard parcelId={parcel.id} />}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Shipment</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Row label="From">{origin ? `${origin.city} (${origin.name})` : '-'}</Row>
              <Row label="To">{destination ? `${destination.city} (${destination.name})` : '-'}</Row>
              <Row label="Category">{CATEGORY_LABEL[parcel.category]}</Row>
              <Row label="Weight">{parcel.weight_kg} kg</Row>
              {hasDims && (
                <Row label="Dimensions">
                  {parcel.length_cm ?? '-'} x {parcel.width_cm ?? '-'} x {parcel.height_cm ?? '-'} cm
                </Row>
              )}
              <Row label="Zone">{ZONE_LABEL[parcel.zone]}</Row>
              {parcel.estimated_delivery_date && !['DELIVERED', 'RETURNED', 'CANCELLED'].includes(parcel.status) && (
                <Row label="Estimated delivery">{formatDate(parcel.estimated_delivery_date)}</Row>
              )}
              {parcel.delivered_at && <Row label="Delivered on">{formatDateTime(parcel.delivered_at)}</Row>}
            </dl>
            {parcel.description && <p className="mt-4 text-sm text-slate-700">Description: {parcel.description}</p>}
            {parcel.special_instructions && (
              <p className="mt-2 text-sm text-slate-700">Handling instructions: {parcel.special_instructions}</p>
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
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Charges</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Shipping charge</dt>
                <dd>{formatINR(parcel.shipping_charge)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">GST</dt>
                <dd>{formatINR(parcel.tax_amount)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(parcel.total_amount)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Payment</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No payment record.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200">
                {payments.map((pm) => (
                  <li key={pm.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{PAYMENT_METHOD_LABEL[pm.method]}</span>
                      <StatusBadge status={pm.status} />
                    </div>
                    <p className="mt-1 text-slate-600">{formatINR(pm.amount)}</p>
                    {pm.transaction_reference && (
                      <p className="mt-1 font-mono text-xs text-slate-500">Ref: {pm.transaction_reference}</p>
                    )}
                    {pm.paid_at && <p className="mt-1 text-xs text-slate-500">Paid {formatDateTime(pm.paid_at)}</p>}
                    {pm.failure_reason && <p className="mt-1 text-xs text-red-600">{pm.failure_reason}</p>}
                  </li>
                ))}
              </ul>
            )}
            {parcel.status === 'BOOKED' && !payments.some((pm) => pm.status === 'SUCCESS') && (
              <div className="mt-4 rounded-md bg-amber-50 px-3 py-3 text-xs text-amber-900">
                <p>Payment is pending. Development payment: no real money is processed.</p>
                <Link
                  to={customerRoutes.pay(parcel.id)}
                  className="mt-2 inline-flex rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Pay now
                </Link>
              </div>
            )}
            {latestPayment?.status === 'PENDING' && latestPayment.method === 'CASH_ON_PICKUP' && (
              <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
                Pay in cash to the delivery partner at pickup.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}