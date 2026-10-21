import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { ProfileInput } from '../schemas/profile'

// Only these columns are sent. Role, branch and status cannot be changed here
// (a database trigger blocks it even if someone tries).
async function update(userId: string, input: ProfileInput): Promise<void> {
  const orNull = (v: string) => (v.trim() === '' ? null : v.trim())
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name.trim(),
      phone: orNull(input.phone),
      address: orNull(input.address),
      city: orNull(input.city),
      state: orNull(input.state),
      pincode: orNull(input.pincode),
    })
    .eq('id', userId)
  if (error) throw new AppError('Your profile could not be saved. Please try again.', error.code)
}

export const profileService = { update }