import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { parcelService } from '../../services/parcelService'
import { paymentService } from '../../services/paymentService'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { customerRoutes } from '../../lib/parcel'
import { formatINR } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function PayBooking() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const validId = UUID.test(id)
  const { data, error, loading } = useAsyncData(`pay:${id}`, async () => (validId ? parcelService.getById(id) : null))
  const [busy, setBusy] = useState<'SUCCESS' | 'FAILED' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const back = (
    <Link to={validId ? customerRoutes.booking(id) : customerRoutes.dashboard} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to booking
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
      <div className="mx-auto max-w-xl space-y-4">
        {back}
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Booking not found.'}
        </p>
      </div>
    )
  }

  const { parcel, payments } = data
  const paid = payments.some((p) => p.status === 'SUCCESS')
  const payable = parcel.status === 'BOOKED' && !paid

  async function pay(outcome: 'SUCCESS' | 'FAILED') {
    setBusy(outcome)
    setMessage(null)
    try {
      const paymentId = await paymentService.ensureAttempt(parcel.id)
      await paymentService.simulate(paymentId, outcome)
      if (outcome === 'SUCCESS') {
        navigate(customerRoutes.booking(parcel.id), { state: { justPaid: true } })
        return
      }
      setMessage('The simulated payment failed. No money was taken. You can try again.')
    } catch (e) {
      setMessage(getErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {back}
      <h1 className="text-2xl font-semibold">Pay for your booking</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Parcel <span className="font-mono font-medium text-slate-900">{parcel.tracking_number}</span>
        </p>
        <p className="mt-2 text-3xl font-semibold">{formatINR(parcel.total_amount)}</p>
      </div>

      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Development payment: no real money is processed and no card details are collected. The result is recorded by the
        server.
      </p>

      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      {payable ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void pay('SUCCESS')} loading={busy === 'SUCCESS'} disabled={busy !== null}>
            Simulate successful payment
          </Button>
          <Button variant="secondary" onClick={() => void pay('FAILED')} loading={busy === 'FAILED'} disabled={busy !== null}>
            Simulate failed payment
          </Button>
        </div>
      ) : (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {paid ? 'This booking is already paid.' : `Payment is not needed for this parcel (status: ${parcel.status.toLowerCase().replace(/_/g, ' ')}).`}
        </p>
      )}
    </div>
  )
}
