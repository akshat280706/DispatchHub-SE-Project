import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { authService } from '../services/authService'
import type { Profile } from '../types/database'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileFor, setProfileFor] = useState<string | null>(null)

  const userId = session?.user.id ?? null

  // Session: restored from storage on load, then kept in sync.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
        setProfileFor(null)
      }
      setInitializing(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Profile (role, branch): reloaded whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) return
    let active = true
    authService
      .getProfile(userId)
      .then((p) => {
        if (!active) return
        setProfile(p)
        setProfileFor(userId)
        if (p && !p.is_active) void supabase.auth.signOut() // deactivated accounts are signed out
      })
      .catch(() => {
        if (!active) return
        setProfile(null)
        setProfileFor(userId)
      })
    return () => {
      active = false
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const p = await authService.getProfile(userId)
    setProfile(p)
  }, [userId])

  const signOut = useCallback(async () => {
    await authService.signOut()
  }, [])

  const currentProfile = userId !== null && profileFor === userId ? profile : null
  const loading = initializing || (userId !== null && profileFor !== userId)

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile: currentProfile,
        role: currentProfile?.role ?? null,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}