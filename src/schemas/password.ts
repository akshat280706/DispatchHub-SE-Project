import { z } from 'zod'

const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number')

export const forgotSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
})
export type ForgotInput = z.infer<typeof forgotSchema>

export const resetSchema = z
  .object({ password: newPassword, confirm_password: z.string().min(1, 'Confirm your password') })
  .refine((v) => v.password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match' })
export type ResetInput = z.infer<typeof resetSchema>

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    password: newPassword,
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match' })
  .refine((v) => v.password !== v.current_password, {
    path: ['password'],
    message: 'Choose a password different from the current one',
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
