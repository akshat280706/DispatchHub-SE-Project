import { supabase } from '../lib/supabaseClient'
import { AppError, friendlyAuthError } from '../lib/errors'
import type { Profile } from '../types/database'

export interface SignUpInput {
  full_name: string
  email: string
  phone?: string
  password: string
}

async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new AppError('Could not load your profile. Please try again.', error.code)
  return data as Profile | null
}

async function signUp(input: SignUpInput): Promise<{ needsEmailConfirmation: boolean }> {
  // The role is never sent. A database trigger always creates a CUSTOMER profile.
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.full_name.trim(), phone: input.phone?.trim() || '' } },
  })
  if (error) throw friendlyAuthError(error)
  return { needsEmailConfirmation: !data.session }
}

async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw friendlyAuthError(error)

  const profile = await getProfile(data.user.id)
  if (!profile) {
    await supabase.auth.signOut()
    throw new AppError('No profile was found for this account. Contact support.')
  }
  if (!profile.is_active) {
    await supabase.auth.signOut()
    throw new AppError('This account has been deactivated. Contact support.', 'account_inactive')
  }
  return profile
}

async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw friendlyAuthError(error)
}

export const authService = { signUp, signIn, signOut, getProfile }