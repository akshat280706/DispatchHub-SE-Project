import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[+]?[0-9]{10,13}$/.test(v), 'Enter 10 to 13 digits (optional + prefix)'),
  address: z.string().trim().max(300, 'Address is too long'),
  city: z.string().trim().max(100, 'City is too long'),
  state: z.string().trim().max(100, 'State is too long'),
  pincode: z.string().trim().refine((v) => v === '' || /^[0-9]{6}$/.test(v), 'Pincode must be 6 digits'),
})
export type ProfileInput = z.infer<typeof profileSchema>