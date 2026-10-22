import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { deliveryService } from '../../services/deliveryService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import Textarea from '../ui/Textarea'
import Spinner from '../ui/Spinner'
import { ALLOWED_PROOF_TYPES } from '../../lib/image'
import { getErrorMessage } from '../../lib/errors'

interface DeliveryVerificationProps {
  parcelId: string
  trackingNumber: string
  onChanged: () => void
}

export default function DeliveryVerification({ parcelId, trackingNumber, onChanged }: DeliveryVerificationProps) {
  const { profile } = useAuth()
  const userId = profile?.id ?? ''
  const fileRef = useRef<HTMLInputElement>(null)

  const proofs = useAsyncData(`proofs:${parcelId}:${userId}`, () => deliveryService.listProofs(parcelId, userId))
  const [uploading, setUploading] = useState(false)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [failOpen, setFailOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [failError, setFailError] = useState<string | null>(null)
  const [failBusy, setFailBusy] = useState(false)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      await deliveryService.uploadProof(parcelId, file)
      proofs.reload()
    } catch (err) {
      setMessage(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function verify() {
    if (!/^[0-9]{6}$/.test(otp)) {
      setMessage('Enter the 6-digit delivery code.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const res = await deliveryService.verifyDelivery(parcelId, otp, (proofs.data ?? []).map((p) => p.id))
      if (res.verified) {
        onChanged()
        return
      }
      const left = res.attempts_left ?? 0
      setMessage(
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Incorrect code. No attempts left. Record a failed attempt, then start the delivery again.',
      )
      setOtp('')
    } catch (err) {
      setMessage(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmFailure() {
    if (reason.trim().length < 3) {
      setFailError('Please give a reason (at least 3 characters).')
      return
    }
    setFailBusy(true)
    setFailError(null)
    try {
      await deliveryService.recordFailure(parcelId, reason.trim())
      setFailOpen(false)
      setReason('')
      onChanged()
    } catch (err) {
      setFailError(getErrorMessage(err))
    } finally {
      setFailBusy(false)
    }
  }

  return (
    <section className="space-y-5 rounded-lg border border-brand-600/30 bg-brand-50 p-5">
      <div>
        <h2 className="text-base font-semibold">Complete the delivery</h2>
        <p className="mt-1 text-sm text-slate-700">
          Take a photo at the delivery address, then ask the receiver for the 6-digit code shown in their DispatchHub account.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">1. Delivery photo</p>
        <input ref={fileRef} type="file" accept={ALLOWED_PROOF_TYPES.join(',')} capture="environment" className="hidden" onChange={(e) => void onFile(e)} />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
            <Camera className="h-4 w-4" aria-hidden="true" /> Add photo
          </Button>
          <span className="text-xs text-slate-600">JPEG, PNG or WebP. Large photos are shrunk automatically.</span>
        </div>

        {proofs.loading && (
          <div className="mt-3" role="status">
            <Spinner />
          </div>
        )}
        {proofs.error && <p className="mt-2 text-sm text-red-700">{proofs.error}</p>}
        {proofs.data && proofs.data.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-3">
            {proofs.data.map((p) => (
              <li key={p.id}>
                {p.url ? (
                  <img src={p.url} alt="Delivery proof" className="h-20 w-20 rounded-md border border-slate-200 object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-md border border-slate-200 text-xs text-slate-500">
                    Saved
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {proofs.data && proofs.data.length === 0 && <p className="mt-2 text-xs text-slate-600">No photo added yet.</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">2. Delivery code</p>
        <div className="mt-2 max-w-xs">
          <Input
            label="Code from the receiver"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void verify()} loading={busy} disabled={uploading}>
          Verify and mark delivered
        </Button>
        <Button variant="secondary" onClick={() => setFailOpen(true)} disabled={busy || uploading}>
          Could not deliver
        </Button>
      </div>

      <Modal open={failOpen} title="Record a failed attempt" onClose={() => (failBusy ? undefined : setFailOpen(false))}>
        <p className="text-sm text-slate-600">
          Parcel <span className="font-mono font-medium">{trackingNumber}</span> will be marked as delivery failed and the customer
          will be told. You can start the delivery again afterwards.
        </p>
        <div className="mt-4">
          <Textarea label="What happened?" value={reason} onChange={(e) => setReason(e.target.value)} error={failError ?? undefined} autoFocus />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setFailOpen(false)} disabled={failBusy}>
            Back
          </Button>
          <Button onClick={() => void confirmFailure()} loading={failBusy}>
            Record failed attempt
          </Button>
        </div>
      </Modal>
    </section>
  )
}