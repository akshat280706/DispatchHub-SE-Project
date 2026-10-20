import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROLE_HOME } from '../lib/navigation'
import { ROUTES } from './routes'
import { FullPageSpinner } from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import type { UserRole } from '../types/database'

// NOTE: guards are for user experience only. Real enforcement is in RLS and the database functions.

export function ProtectedRoute() {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">We could not load your profile</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          Your account is signed in, but the profile could not be loaded or is inactive. Sign out and try again.
        </p>
        <Button className="mt-5" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    )
  }
  return <Outlet />
}

export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { profile } = useAuth()
  if (!profile) return null
  if (!roles.includes(profile.role)) return <Navigate to={ROLE_HOME[profile.role]} replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (session && profile) return <Navigate to={ROLE_HOME[profile.role]} replace />
  return <Outlet />
}

export function RoleHomeRedirect() {
  const { profile } = useAuth()
  if (!profile) return null
  return <Navigate to={ROLE_HOME[profile.role]} replace />
}