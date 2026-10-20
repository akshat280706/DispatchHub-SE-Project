import { supabase } from '../lib/supabaseClient'
import { AppError } from '../lib/errors'
import type { ContactInput } from '../schemas/contact'

// No .select() after insert: visitors may insert messages but cannot read them back.
async function send(input: ContactInput): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  })
  if (error) throw new AppError('Your message could not be sent. Please try again in a moment.', error.code)
}

export const contactService = { send }
