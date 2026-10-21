import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { parcelService } from '../../services/parcelService'
import { getErrorMessage } from '../../lib/errors'

interface CancelParcelDialogProps {
  open: boolean
  parcelId: string
  trackingNumber: string
  onClose: () => void
  onCancelled: () => void
}

export default function CancelParcelDialog({ open, parcelId, trackingNumber, onClose, onCancelled }: CancelParcelDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function close() {
    if (busy) return
    setReason('')
    setError(null)
    onClose()
  }

  async function confirm() {
    if (reason.trim().length < 3) {
      setError('Please give a reason (at least 3 characters).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await parcelService.cancel(parcelId, reason.trim())
      setReason('')
      setBusy(false)
      onCancelled()
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title="Cancel this booking?" onClose={close}>
      <p className="text-sm text-slate-600">
        Parcel <span className="font-mono font-medium">{trackingNumber}</span> will be cancelled. This cannot be undone.
        If you already paid, the payment is marked as refunded in the records (no real money moves in development mode).
      </p>
      <div className="mt-4">
        <Textarea
          label="Reason for cancelling"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={error ?? undefined}
          autoFocus
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={busy}>
          Keep booking
        </Button>
        <Button onClick={() => void confirm()} loading={busy} className="bg-red-600 hover:bg-red-700">
          Cancel booking
        </Button>
      </div>
    </Modal>
  )
}