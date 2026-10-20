import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100, 'Name is too long'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address').max(150),
  subject: z.string().trim().min(3, 'Enter a subject (at least 3 characters)').max(150, 'Subject is too long'),
  message: z.string().trim().min(10, 'Write at least 10 characters').max(2000, 'Message is too long (2000 characters max)'),
})
export type ContactInput = z.infer<typeof contactSchema>
