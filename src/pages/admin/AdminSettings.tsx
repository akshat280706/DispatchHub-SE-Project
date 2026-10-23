import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminConfigService } from '../../services/adminConfigService'
import type { SettingRow } from '../../services/adminConfigService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import ActiveBadge from '../../components/ui/ActiveBadge'
import { formatDateTime } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

function display(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

interface EditProps {
  row: SettingRow
  onClose: () => void
  onSaved: () => void
}

function EditSetting({ row, onClose, onSaved }: EditProps) {
  const kind = typeof row.value === 'boolean' ? 'boolean' : typeof row.value === 'number' ? 'number' : 'string'
  const [text, setText] = useState(display(row.value))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    let value: unknown
    if (kind === 'boolean') {
      value = text === 'true'
    } else if (kind === 'number') {
      const n = Number(text)
      if (text.trim() === '' || !Number.isFinite(n)) {
        setError('Enter a valid number.')
        return
      }
      value = n
    } else {
      value = text.trim()
    }
    setBusy(true)
    setError(null)
    try {
      await adminConfigService.updateSetting(row.key, value)
      onSaved()
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-sm font-medium">{row.key}</p>
        {row.description && <p className="mt-1 text-sm text-slate-600">{row.description}</p>}
      </div>

      {kind === 'boolean' ? (
        <Select label="Value" value={text} onChange={(e) => setText(e.target.value)}>
          <option value="true">true</option>
          <option value="false">false</option>
        </Select>
      ) : (
        <Input label="Value" inputMode={kind === 'number' ? 'decimal' : undefined} value={text} onChange={(e) => setText(e.target.value)} />
      )}

      {row.key === 'dev.show_delivery_otp' && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Development only. Delivery codes are not sent by SMS or email in this project. If you turn this off, customers can no longer
          see their code in the app and new deliveries cannot be completed. Keep it on for your demo.
        </p>
      )}
      {row.key === 'delivery.require_photo' && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          When true, a rider must upload a delivery photo before a delivery can be verified.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void save()} loading={busy}>
          Save setting
        </Button>
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const { data, error, loading, reload } = useAsyncData('admin-settings', () => adminConfigService.listSettings())
  const [editing, setEditing] = useState<SettingRow | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tax, limits, delivery rules and public contact details. Every change is validated and written to the audit log.
        </p>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </p>
      )}
      {loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {data.map((s) => (
            <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-medium">{s.key}</p>
                  <ActiveBadge active={s.is_public} on="Public" off="Private" />
                </div>
                {s.description && <p className="mt-1 text-sm text-slate-600">{s.description}</p>}
                <p className="mt-1 text-xs text-slate-500">Updated {formatDateTime(s.updated_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="max-w-[16rem] truncate rounded bg-slate-100 px-2 py-1 font-mono text-sm" title={display(s.value)}>
                  {display(s.value)}
                </span>
                <Button variant="secondary" onClick={() => { setNotice(null); setEditing(s) }}>
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} title="Edit setting" onClose={() => setEditing(null)}>
        {editing && (
          <EditSetting
            key={editing.key}
            row={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setNotice(`Setting "${editing.key}" was updated.`)
              setEditing(null)
              reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
