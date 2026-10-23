import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { notificationRoute } from '../../lib/notifications'

export default function NotificationBell() {
  const { profile } = useAuth()
  const count = useUnreadCount(profile?.id)
  if (!profile) return null

  return (
    <Link
      to={notificationRoute(profile.role)}
      className="relative rounded-md p-2 text-slate-700 hover:bg-slate-100"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
