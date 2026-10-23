import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { announceNotificationsChanged, notificationService } from '../../services/notificationService'
import type { NotificationFilters } from '../../services/notificationService'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { NOTIFICATION_TYPE_LABEL, parcelLinkFor } from '../../lib/notifications'
import { formatDateTime } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { NotificationType } from '../../types/database'

const PAGE_SIZE = 10
const TYPES = Object.keys(NOTIFICATION_TYPE_LABEL) as NotificationType[]

export default function Notifications() {
  const { profile } = useAuth()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [type, setType] = useState<NotificationType | ''>('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const filters: NotificationFilters = { unreadOnly, type, page, pageSize: PAGE_SIZE }
  const list = useAsyncData(`notifications:${JSON.stringify(filters)}`, () => notificationService.list(filters))
  const role = profile?.role

  async function markOne(id: string) {
    setMessage(null)
    try {
      await notificationService.markRead([id])
      announceNotificationsChanged()
      list.reload()
    } catch (e) {
      setMessage(getErrorMessage(e))
    }
  }

  async function markAll() {
    setBusy(true)
    setMessage(null)
    try {
      await notificationService.markAllRead()
      announceNotificationsChanged()
      list.reload()
    } catch (e) {
      setMessage(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function openedLink(id: string, isRead: boolean) {
    if (isRead) return
    void notificationService.markRead([id]).then(announceNotificationsChanged, () => undefined)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-slate-600">Updates about your parcels, payments, assignments and complaints.</p>
        </div>
        <Button variant="secondary" onClick={() => void markAll()} loading={busy}>
          Mark all as read
        </Button>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Select
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as NotificationType | '')
            setPage(1)
          }}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {NOTIFICATION_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked)
              setPage(1)
            }}
          />
          Show unread only
        </label>
      </div>

      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}
      {list.loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {list.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {list.error}
        </p>
      )}
      {list.data && list.data.data.length === 0 && (
        <EmptyState
          title={unreadOnly || type ? 'No notifications match your filters' : 'No notifications yet'}
          text="Updates about your activity will appear here."
        />
      )}

      {list.data && list.data.data.length > 0 && (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {list.data.data.map((n) => {
              const link = role && n.parcel_id ? parcelLinkFor(role, n.parcel_id) : null
              return (
                <li key={n.id} className={`flex items-start gap-3 p-4 ${n.is_read ? '' : 'bg-brand-50/50'}`}>
                  <span
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-brand-600'}`}
                    aria-label={n.is_read ? undefined : 'Unread'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {NOTIFICATION_TYPE_LABEL[n.type]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>{formatDateTime(n.created_at)}</span>
                      {link && (
                        <Link
                          to={link}
                          onClick={() => openedLink(n.id, n.is_read)}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          View parcel
                        </Link>
                      )}
                      {!n.is_read && (
                        <button className="font-medium text-brand-700 hover:underline" onClick={() => void markOne(n.id)}>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
