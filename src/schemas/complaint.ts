import { z } from 'zod'

export const complaintSchema = z.object({
  parcel_id: z.string().min(1, 'Select the parcel'),
  subject: z.string().trim().min(3, 'Enter a subject (at least 3 characters)').max(150, 'Subject is too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the problem (at least 10 characters)')
    .max(2000, 'Description is too long (2000 characters max)'),
})
export type ComplaintInput = z.infer<typeof complaintSchema>
