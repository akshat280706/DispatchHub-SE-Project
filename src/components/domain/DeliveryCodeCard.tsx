import { useAsyncData } from '../../hooks/useAsyncData'
import { deliveryService } from '../../services/deliveryService'
import { formatDateTime } from '../../lib/format'

export default function DeliveryCodeCard({ parcelId }: { parcelId: string }) {
  const { data } = useAsyncData(`otp:${parcelId}`, () => deliveryService.getDevOtp(parcelId))
  if (!data) return null

  return (
    <section className="rounded-lg border border-brand-600/30 bg-brand-50 p-5">
      <h2 className="text-base font-semibold">Delivery code</h2>
      <p className="mt-1 text-sm text-slate-700">Give this code to the delivery partner when the parcel arrives.</p>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-widest text-navy-900">{data.otp}</p>
      <p className="mt-2 text-xs text-slate-600">
        Valid until {formatDateTime(data.expires_at)}. {data.attempts_left} attempts left.
      </p>
      <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">{data.notice}</p>
    </section>
  )
}
