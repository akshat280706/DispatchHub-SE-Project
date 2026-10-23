import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { forgotSchema } from '../../schemas/password'
import type { ForgotInput } from '../../schemas/password'
import { passwordService } from '../../services/passwordService'
import { AppError, getErrorMessage } from '../../lib/errors'
import { ROUTES } from '../../app/routes'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) })

  async function onSubmit(values: ForgotInput) {
    setFormError(null)
    try {
      await passwordService.requestReset(values.email)
      setSent(true)
    } catch (e) {
      // Rate-limit and similar errors are shown. Otherwise we never reveal whether an account exists.
      if (e instanceof AppError && e.code === 'rate_limited') setFormError(getErrorMessage(e))
      else setSent(true)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset">
        <p className="text-sm text-slate-700">
          If an account exists for that email, we have sent a link to reset the password. The link works for a limited time.
        </p>
        <Link to={ROUTES.login} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>
      <Link to={ROUTES.login} className="mt-5 inline-block text-sm font-medium text-brand-700 hover:underline">
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
