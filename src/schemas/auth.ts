import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
    email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[+]?[0-9]{10,13}$/.test(v), 'Enter 10 to 13 digits (optional + prefix)'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirm_password: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
export type RegisterInput = z.infer<typeof registerSchema>