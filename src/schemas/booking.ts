import { z } from 'zod'
import { CATEGORY_OPTIONS } from '../lib/parcel'

const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9]{10,13}$/, 'Enter 10 to 13 digits (optional + prefix)')

const optionalPositive = z
  .string()
  .trim()
  .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) > 0), 'Enter a number above 0')

const CATEGORY_VALUES: string[] = CATEGORY_OPTIONS.map((c) => c.value)

// All fields are strings (as typed in the form). They are converted when the booking is sent.
export const bookingSchema = z
  .object({
    origin_branch_id: z.string().min(1, 'Select the origin branch'),
    destination_branch_id: z.string().min(1, 'Select the destination branch'),

    sender_name: z.string().trim().min(2, 'Enter the sender name').max(100),
    sender_phone: phone,
    pickup_address: z.string().trim().min(5, 'Enter the pickup address').max(300),

    receiver_name: z.string().trim().min(2, 'Enter the receiver name').max(100),
    receiver_phone: phone,
    delivery_address: z.string().trim().min(5, 'Enter the delivery address').max(300),
    delivery_city: z.string().trim().min(2, 'Enter the delivery city').max(100),
    delivery_pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),

    category: z.string().refine((v): boolean => CATEGORY_VALUES.includes(v), 'Select a category'),
    weight_kg: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Enter the weight in kg (above 0)'),
    length_cm: optionalPositive,
    width_cm: optionalPositive,
    height_cm: optionalPositive,
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    special_instructions: z.string().trim().max(500, 'Keep the instructions under 500 characters'),

    payment_method: z
      .string()
      .refine((v): boolean => v === 'DEV_SIMULATED' || v === 'CASH_ON_PICKUP', 'Select a payment method'),
  })
  .refine((v) => v.origin_branch_id !== v.destination_branch_id, {
    path: ['destination_branch_id'],
    message: 'Destination must be a different branch',
  })

export type BookingFormInput = z.infer<typeof bookingSchema>