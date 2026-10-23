import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { resetSchema } from '../../schemas/password'
import type { ResetInput } from '../../schemas/password'
import { passwordService } from '../../services/passwordService'
import { getErrorMessage } from '../../lib/errors'
import { ROUTES } from '../../app/routes'

export default function ResetPassword() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) })

  if (loading) return <FullPageSpinner />

  // The emailed link signs the user in temporarily. Without a session the link was invalid or has expired.
  if (!session) {
    return (
      <AuthLayout title="Link not valid" subtitle="This reset link is invalid or has expired.">
        <Link to={ROUTES.forgotPassword} className="text-sm font-medium text-brand-700 hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now use your new password.">
        <Button onClick={() => navigate('/app', { replace: true })} className="w-full">
          Continue to your dashboard
        </Button>
      </AuthLayout>
    )
  }

  async function onSubmit(values: ResetInput) {
    setFormError(null)
    try {
      await passwordService.setNewPassword(values.password)
      setDone(true)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Save new password
        </Button>
      </form>
    </AuthLayout>
  )
}
