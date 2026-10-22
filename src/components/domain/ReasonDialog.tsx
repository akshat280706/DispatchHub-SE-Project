import { useState } from 'react'
import type { ReactNode } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { getErrorMessage } from '../../lib/errors'

interface ReasonDialogProps {
  open: boolean
  title: string
  description: ReactNode
  label: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onSubmit: (text: string) => Promise<void>
}

export default function ReasonDialog({ open, title, description, label, confirmLabel, danger, onClose, onSubmit }: ReasonDialogProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function close() {
    if (busy) return
    setText('')
    setError(null)
    onClose()
  }

  async function confirm() {
    if (text.trim().length < 3) {
      setError('Please write at least 3 characters.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={title} onClose={close}>
      <div className="text-sm text-slate-600">{description}</div>
      <div className="mt-4">
        <Textarea label={label} value={text} onChange={(e) => setText(e.target.value)} error={error ?? undefined} autoFocus />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={busy}>
          Back
        </Button>
        <Button onClick={() => void confirm()} loading={busy} className={danger ? 'bg-red-600 hover:bg-red-700' : ''}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}