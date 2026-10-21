import { AppError } from './errors'

// Database functions raise readable messages for these codes. Anything else gets a generic message.
const SAFE_CODES = new Set(['22023', '42501', '28000', 'P0002', '40001'])

export function rpcError(error: { message: string; code?: string }, fallback: string): AppError {
  if (error.code && SAFE_CODES.has(error.code)) return new AppError(error.message, error.code)
  return new AppError(fallback, error.code)
}