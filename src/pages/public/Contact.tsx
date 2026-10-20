import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { contactSchema } from '../../schemas/contact'
import type { ContactInput } from '../../schemas/contact'
import { contactService } from '../../services/contactService'
import { settingText, usePublicSettings } from '../../hooks/usePublicSettings'
import { getErrorMessage } from '../../lib/errors'

export default function Contact() {
  const { settings } = usePublicSettings()
  const email = settingText(settings, 'contact.email', 'support@dispatchhub.example')
  const phone = settingText(settings, 'contact.phone', '+91 00000 00000')
  const address = settingText(settings, 'contact.address', 'DispatchHub Demo Office, Mumbai, Maharashtra')

  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) })

  async function onSubmit(values: ContactInput) {
    setFormError(null)
    try {
      await contactService.send(values)
      reset()
      setSent(true)
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <>
      <PageHeader title="Contact us" subtitle="Questions about a booking or the service? Send us a message." />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {sent ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6" role="status">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Message sent
              </div>
              <p className="mt-2 text-sm text-emerald-900">
                Thank you. Your message has been saved and the team can read it from the admin area.
              </p>
              <Button variant="secondary" className="mt-4" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6" noValidate>
              {formError && (
                <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" autoComplete="name" error={errors.name?.message} {...register('name')} />
                <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              </div>
              <Input label="Subject" error={errors.subject?.message} {...register('subject')} />
              <div>
                <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 ${
                    errors.message ? 'border-red-500' : 'border-slate-300'
                  }`}
                  {...register('message')}
                />
                {errors.message && (
                  <p id="contact-message-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>
              <Button type="submit" loading={isSubmitting}>
                Send message
              </Button>
            </form>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 text-sm">
          <h2 className="text-base font-semibold">Contact details</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd>
                <a href={`mailto:${email}`} className="font-medium text-brand-700 hover:underline">
                  {email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium">{phone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd className="font-medium">{address}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </>
  )
}