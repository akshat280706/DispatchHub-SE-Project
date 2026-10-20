import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { registerSchema } from '../../schemas/auth'
import type { RegisterInput } from '../../schemas/auth'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../lib/errors'
import { ROUTES } from '../../app/routes'

export default function Register() {
  const [formError, setFormError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterInput) {
    setFormError(null)
    try {
      const result = await authService.signUp({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      // With email confirmation off, a session exists and PublicOnlyRoute redirects automatically.
      if (result.needsEmailConfirmation) setNeedsConfirmation(true)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  if (needsConfirmation) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account.">
        <p className="text-sm text-slate-700">
          We sent a confirmation link to your email address. Open it, then sign in.
        </p>
        <Link to={ROUTES.login} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Go to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Book and track parcels with DispatchHub.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <Input label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="9876543210"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to={ROUTES.login} className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}