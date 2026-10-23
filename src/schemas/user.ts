import { z } from 'zod'

const STAFF_ROLES = ['BRANCH_MANAGER', 'DELIVERY_PERSONNEL', 'ADMIN']

export const createStaffSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter the full name').max(100, 'Name is too long'),
    email: z.string().trim().min(1, 'Enter the email').email('Enter a valid email address').max(150),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[+]?[0-9]{10,13}$/.test(v), 'Enter 10 to 13 digits (optional + prefix)'),
    role: z.string().refine((v) => STAFF_ROLES.includes(v), 'Choose a role'),
    branch_id: z.string(),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
  })
  .refine((v) => v.role === 'ADMIN' || v.branch_id !== '', {
    path: ['branch_id'],
    message: 'Select a branch for this role',
  })

export type CreateStaffInput = z.infer<typeof createStaffSchema>
