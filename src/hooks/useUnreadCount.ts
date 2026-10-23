import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NOTIFICATIONS_CHANGED, notificationService } from '../services/notificationService'

// Refreshes on navigation, when notifications change, and every 30 seconds.
export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0)
  const [tick, setTick] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (!userId) return
    let active = true
    notificationService
      .unreadCount()
      .then((n) => {
        if (active) setCount(n)
      })
      .catch(() => {
        /* keep the last known count */
      })
    return () => {
      active = false
    }
  }, [userId, tick, location.pathname])

  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener(NOTIFICATIONS_CHANGED, bump)
    const timer = window.setInterval(bump, 30000)
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED, bump)
      window.clearInterval(timer)
    }
  }, [])

  return count
}
