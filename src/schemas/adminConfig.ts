import { z } from 'zod'
import { CATEGORY_OPTIONS } from '../lib/parcel'

const ZONES = ['LOCAL', 'REGIONAL', 'NATIONAL']
const CATEGORIES: string[] = CATEGORY_OPTIONS.map((c) => c.value)

const nonNegative = z
  .string()
  .trim()
  .refine((v) => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100000, 'Enter an amount from 0 to 100000')

export const branchSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9]{3,10}$/, 'Use 3 to 10 letters or digits'),
  name: z.string().trim().min(2, 'Enter the branch name').max(100),
  city: z.string().trim().min(2, 'Enter the city').max(100),
  state: z.string().trim().min(2, 'Enter the state').max(100),
  address: z.string().trim().max(300, 'Address is too long'),
  pincode: z.string().trim().refine((v) => v === '' || /^[0-9]{6}$/.test(v), 'Pincode must be 6 digits'),
  phone: z.string().trim().refine((v) => v === '' || /^[+]?[0-9 ]{8,15}$/.test(v), 'Enter a valid phone number'),
  is_active: z.boolean(),
})
export type BranchInput = z.infer<typeof branchSchema>

export const rateSchema = z.object({
  zone: z.string().refine((v) => ZONES.includes(v), 'Choose a zone'),
  category: z.string().refine((v) => CATEGORIES.includes(v), 'Choose a category'),
  base_charge: nonNegative,
  base_weight_kg: z
    .string()
    .trim()
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) <= 1000, 'Enter a weight above 0 (up to 1000 kg)'),
  per_kg_charge: nonNegative,
  handling_surcharge: nonNegative,
  is_active: z.boolean(),
})
export type RateInput = z.infer<typeof rateSchema>
