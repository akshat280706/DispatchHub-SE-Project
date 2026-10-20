export class AppError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

interface SupabaseLikeError {
  message: string
  code?: string
  status?: number
}

export function friendlyAuthError(error: SupabaseLikeError): AppError {
  const msg = error.message.toLowerCase()
  if (error.code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return new AppError('Incorrect email or password.', 'invalid_credentials')
  }
  if (error.code === 'user_already_exists' || msg.includes('already registered')) {
    return new AppError('An account with this email already exists. Try signing in.', 'user_already_exists')
  }
  if (error.code === 'email_not_confirmed') {
    return new AppError('Please confirm your email address before signing in.', 'email_not_confirmed')
  }
  if (error.code === 'weak_password') {
    return new AppError('Choose a stronger password (at least 8 characters, with a letter and a number).', 'weak_password')
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return new AppError('Too many attempts. Please wait a minute and try again.', 'rate_limited')
  }
  return new AppError(error.message || 'Something went wrong. Please try again.', error.code)
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message: unknown }).message)
  return 'Something went wrong. Please try again.'
}