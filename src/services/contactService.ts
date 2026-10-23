import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import { rpcError } from '../lib/rpc'
import type { ContactInput } from '../schemas/contact'

// Messages go through a rate-limited database function. Visitors cannot read them back.
async function send(input: ContactInput): Promise<void> {
  const { data, error } = await supabase.rpc('submit_contact_message', {
    p_name: input.name.trim(),
    p_email: input.email.trim(),
    p_subject: input.subject.trim(),
    p_message: input.message.trim(),
  })
  if (error) throw rpcError(error, 'Your message could not be sent. Please try again in a moment.')
  if (data && typeof data === 'object' && 'rate_limited' in data) {
    throw new AppError('You have sent several messages recently. Please try again later.', 'rate_limited')
  }
}

export const contactService = { send }