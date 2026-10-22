import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import Spinner from '../ui/Spinner'
import { useAsyncData } from '../../hooks/useAsyncData'
import { managerService } from '../../services/managerService'
import { getErrorMessage } from '../../lib/errors'
import type { AssignmentType } from '../../types/database'

interface AssignDialogProps {
  open: boolean
  parcelId: string
  trackingNumber: string
  type: AssignmentType
  currentPersonnelId: string | null // set when reassigning
  onClose: () => void
  onDone: () => void
}

function AssignForm({ parcelId, trackingNumber, type, currentPersonnelId, onClose, onDone }: Omit<AssignDialogProps, 'open'>) {
  const people = useAsyncData('assign-personnel', () => managerService.listPersonnel())
  const [personId, setPersonId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const reassigning = currentPersonnelId !== null

  async function submit() {
    if (!personId) {
      setError('Choose a delivery person.')
      return
    }
    if (reassigning && reason.trim().length < 3) {
      setError('A reason is required to reassign (at least 3 characters).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await managerService.assign(parcelId, personId, type, reassigning ? reason.trim() : null)
      onDone()
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {reassigning ? 'Reassign' : 'Assign'} the {type === 'PICKUP' ? 'pickup' : 'delivery'} of parcel{' '}
        <span className="font-mono font-medium">{trackingNumber}</span>. The rider is notified.
      </p>

      {people.loading && (
        <div role="status">
          <Spinner />
        </div>
      )}
      {people.error && <p className="text-sm text-red-700">{people.error}</p>}

      {people.data && (
        <Select label="Delivery person" value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">Select a person</option>
          {people.data
            .filter((p) => p.id !== currentPersonnelId)
            .map((p) => (
              <option key={p.id} value={p.id} disabled={!p.is_available}>
                {p.full_name}
                {p.is_available ? '' : ' (unavailable)'}
              </option>
            ))}
        </Select>
      )}
      {people.data && people.data.length === 0 && (
        <p className="text-sm text-amber-800">No delivery personnel belong to your branch yet.</p>
      )}

      {reassigning && <Textarea label="Reason for reassigning" value={reason} onChange={(e) => setReason(e.target.value)} />}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Back
        </Button>
        <Button onClick={() => void submit()} loading={busy}>
          {reassigning ? 'Reassign' : 'Assign'}
        </Button>
      </div>
    </div>
  )
}

export default function AssignDialog(props: AssignDialogProps) {
  return (
    <Modal open={props.open} title={props.currentPersonnelId ? 'Reassign delivery person' : 'Assign delivery person'} onClose={props.onClose}>
      <AssignForm
        parcelId={props.parcelId}
        trackingNumber={props.trackingNumber}
        type={props.type}
        currentPersonnelId={props.currentPersonnelId}
        onClose={props.onClose}
        onDone={props.onDone}
      />
    </Modal>
  )
}