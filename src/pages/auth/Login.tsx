import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { loginSchema } from '../../schemas/auth'
import type { LoginInput } from '../../schemas/auth'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../lib/errors'
import { ROUTES } from '../../app/routes'

// Visible only in `npm run dev`. Never shipped in a production build.
const DEV_ACCOUNTS = [
  { label: 'Customer', email: 'customer@dispatchhub.test' },
  { label: 'Rider (Pune)', email: 'rider.pun@dispatchhub.test' },
  { label: 'Rider (Mumbai)', email: 'rider.mum@dispatchhub.test' },
  { label: 'Manager (Pune)', email: 'manager.pun@dispatchhub.test' },
  { label: 'Manager (Mumbai)', email: 'manager.mum@dispatchhub.test' },
  { label: 'Admin', email: 'admin@dispatchhub.test' },
]

export default function Login() {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginInput) {
    setFormError(null)
    try {
      await authService.signIn(values.email, values.password)
      // PublicOnlyRoute redirects to the role's home once the session and profile load.
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access your DispatchHub account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        New to DispatchHub?{' '}
        <Link to={ROUTES.register} className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Development accounts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEV_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setValue('email', a.email)
                  setValue('password', 'Test@12345')
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Fills the form. Click Sign in afterwards.</p>
        </div>
      )}
    </AuthLayout>
  )
}