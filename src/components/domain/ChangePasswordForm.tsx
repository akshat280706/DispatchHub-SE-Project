import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { changePasswordSchema } from '../../schemas/password'
import type { ChangePasswordInput } from '../../schemas/password'
import { passwordService } from '../../services/passwordService'
import { getErrorMessage } from '../../lib/errors'

export default function ChangePasswordForm({ email }: { email: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', password: '', confirm_password: '' },
  })

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null)
    setSaved(false)
    try {
      await passwordService.changePassword(email, values.current_password, values.password)
      reset()
      setSaved(true)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Password changed.
        </p>
      )}
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.current_password?.message}
        {...register('current_password')}
      />
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
      <Button type="submit" loading={isSubmitting}>
        Change password
      </Button>
    </form>
  )
}
