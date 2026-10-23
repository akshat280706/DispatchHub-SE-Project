import { supabase } from '../lib/supabaseClient'
import { AppError, friendlyAuthError } from '../lib/errors'

function mapUpdateError(error: { message: string; code?: string; status?: number }): AppError {
  if (error.code === 'same_password') return new AppError('Choose a password different from your current one.', error.code)
  return friendlyAuthError(error)
}

// Sends a reset link. The caller shows the same message whether or not the email has an account.
async function requestReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw friendlyAuthError(error)
}

// Re-checks the current password first, then sets the new one.
async function changePassword(email: string, current: string, next: string): Promise<void> {
  const { error: reauth } = await supabase.auth.signInWithPassword({ email, password: current })
  if (reauth) {
    if (reauth.code === 'invalid_credentials') throw new AppError('Your current password is incorrect.', reauth.code)
    throw friendlyAuthError(reauth)
  }
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw mapUpdateError(error)
}

// Used on the reset page, where the emailed link has already signed the user in temporarily.
async function setNewPassword(next: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw mapUpdateError(error)
}

export const passwordService = { requestReset, changePassword, setNewPassword }
