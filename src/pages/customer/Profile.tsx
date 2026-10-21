import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { profileSchema } from '../../schemas/profile'
import type { ProfileInput } from '../../schemas/profile'
import { profileService } from '../../services/profileService'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { ROLE_LABEL } from '../../lib/navigation'
import { getErrorMessage } from '../../lib/errors'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
      pincode: profile?.pincode ?? '',
    },
  })

  if (!profile) return null
  const userId = profile.id

  async function onSubmit(values: ProfileInput) {
    setFormError(null)
    setSaved(false)
    try {
      await profileService.update(userId, values)
      await refreshProfile()
      reset(values)
      setSaved(true)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">My profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your details are used to prefill the booking form. Email and role can only be changed by an administrator.
      </p>

      <dl className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium">{ROLE_LABEL[profile.role]}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {saved && (
          <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Profile saved.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        </div>
        <Textarea label="Address" error={errors.address?.message} {...register('address')} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="State" error={errors.state?.message} {...register('state')} />
          <Input label="Pincode" inputMode="numeric" maxLength={6} error={errors.pincode?.message} {...register('pincode')} />
        </div>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  )
}