import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebounce } from '../../hooks/useDebounce'
import { branchService } from '../../services/branchService'
import { parcelService } from '../../services/parcelService'
import { bookingSchema } from '../../schemas/booking'
import type { BookingFormInput } from '../../schemas/booking'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import CostBreakdown from '../../components/domain/CostBreakdown'
import { CATEGORY_OPTIONS, customerRoutes } from '../../lib/parcel'
import { formatINR } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { ParcelCategory } from '../../types/database'
import type { BookingPayload, Quote, QuoteInput } from '../../types/api'

interface QuoteResult {
  key: string
  quote: Quote | null
  error: string | null
}

function toPayload(v: BookingFormInput): BookingPayload {
  const num = (s: string) => (s.trim() === '' ? null : Number(s))
  return {
    origin_branch_id: v.origin_branch_id,
    destination_branch_id: v.destination_branch_id,
    sender_name: v.sender_name,
    sender_phone: v.sender_phone,
    pickup_address: v.pickup_address,
    receiver_name: v.receiver_name,
    receiver_phone: v.receiver_phone,
    delivery_address: v.delivery_address,
    delivery_city: v.delivery_city,
    delivery_pincode: v.delivery_pincode,
    category: v.category as ParcelCategory,
    weight_kg: Number(v.weight_kg),
    length_cm: num(v.length_cm),
    width_cm: num(v.width_cm),
    height_cm: num(v.height_cm),
    description: v.description,
    special_instructions: v.special_instructions,
    payment_method: v.payment_method as BookingPayload['payment_method'],
  }
}

export default function BookParcel() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const branches = useAsyncData('branches', () => branchService.listActive())

  // One key per form visit: submitting twice returns the same booking instead of creating another.
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingSchema) as unknown as Resolver<BookingFormInput>,
    defaultValues: {
      origin_branch_id: '',
      destination_branch_id: '',
      sender_name: profile?.full_name ?? '',
      sender_phone: profile?.phone ?? '',
      pickup_address: profile?.address ?? '',
      receiver_name: '',
      receiver_phone: '',
      delivery_address: '',
      delivery_city: '',
      delivery_pincode: '',
      category: '',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
      description: '',
      special_instructions: '',
      payment_method: 'DEV_SIMULATED',
    },
  })

  const [origin, destination, category, weight, paymentMethod] = useWatch({
    control,
    name: ['origin_branch_id', 'destination_branch_id', 'category', 'weight_kg', 'payment_method'],
  })

  // ---- live quote (server-calculated, debounced) ----
  const quoteKey = useMemo(() => {
    const w = Number(weight)
    if (!origin || !destination || origin === destination || !category || !(w > 0)) return ''
    const input: QuoteInput = {
      origin_branch_id: origin,
      destination_branch_id: destination,
      category: category as ParcelCategory,
      weight_kg: w,
    }
    return JSON.stringify(input)
  }, [origin, destination, category, weight])

  const debouncedKey = useDebounce(quoteKey, 400)
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null)

  useEffect(() => {
    if (!debouncedKey) return
    let active = true
    parcelService
      .quote(JSON.parse(debouncedKey) as QuoteInput)
      .then((quote) => {
        if (active) setQuoteResult({ key: debouncedKey, quote, error: null })
      })
      .catch((e: unknown) => {
        if (active) setQuoteResult({ key: debouncedKey, quote: null, error: getErrorMessage(e) })
      })
    return () => {
      active = false
    }
  }, [debouncedKey])

  const quoteLoading = quoteKey !== '' && (quoteKey !== debouncedKey || quoteResult?.key !== debouncedKey)
  const shownQuote = quoteKey !== '' && !quoteLoading ? quoteResult : null

  async function onSubmit(values: BookingFormInput) {
    setFormError(null)
    try {
      const parcel = await parcelService.book(toPayload(values), idempotencyKey)
      navigate(customerRoutes.booking(parcel.id), { state: { justBooked: true } })
    } catch (e) {
      setFormError(getErrorMessage(e))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const branchOptions = branches.data ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Book a parcel</h1>
      <p className="mt-1 text-sm text-slate-600">Fill in the details. The price updates as you go.</p>

      {formError && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      {branches.error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {branches.error}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Route</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select label="Origin branch" error={errors.origin_branch_id?.message} {...register('origin_branch_id')}>
                <option value="">Select branch</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </Select>
              <Select
                label="Destination branch"
                error={errors.destination_branch_id?.message}
                {...register('destination_branch_id')}
              >
                <option value="">Select branch</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Sender</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Sender name" error={errors.sender_name?.message} {...register('sender_name')} />
              <Input label="Sender phone" type="tel" error={errors.sender_phone?.message} {...register('sender_phone')} />
            </div>
            <div className="mt-4">
              <Textarea label="Pickup address" error={errors.pickup_address?.message} {...register('pickup_address')} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Receiver</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Receiver name" error={errors.receiver_name?.message} {...register('receiver_name')} />
              <Input label="Receiver phone" type="tel" error={errors.receiver_phone?.message} {...register('receiver_phone')} />
            </div>
            <div className="mt-4">
              <Textarea label="Delivery address" error={errors.delivery_address?.message} {...register('delivery_address')} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Delivery city" error={errors.delivery_city?.message} {...register('delivery_city')} />
              <Input
                label="Delivery pincode"
                inputMode="numeric"
                maxLength={6}
                error={errors.delivery_pincode?.message}
                {...register('delivery_pincode')}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Parcel</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select label="Category" error={errors.category?.message} {...register('category')}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Weight (kg)"
                inputMode="decimal"
                placeholder="2.5"
                error={errors.weight_kg?.message}
                {...register('weight_kg')}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input label="Length (cm, optional)" inputMode="decimal" error={errors.length_cm?.message} {...register('length_cm')} />
              <Input label="Width (cm, optional)" inputMode="decimal" error={errors.width_cm?.message} {...register('width_cm')} />
              <Input label="Height (cm, optional)" inputMode="decimal" error={errors.height_cm?.message} {...register('height_cm')} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Dimensions are recorded for handling. The price is based on weight.</p>
            <div className="mt-4 space-y-4">
              <Textarea label="Description (optional)" error={errors.description?.message} {...register('description')} />
              <Textarea
                label="Special handling instructions (optional)"
                error={errors.special_instructions?.message}
                {...register('special_instructions')}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Payment</h2>
            <div className="mt-4 max-w-sm">
              <Select label="Payment method" error={errors.payment_method?.message} {...register('payment_method')}>
                <option value="DEV_SIMULATED">Development payment (simulated)</option>
                <option value="CASH_ON_PICKUP">Cash on pickup</option>
              </Select>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {paymentMethod === 'CASH_ON_PICKUP'
                ? 'You pay the delivery partner at pickup. The booking is confirmed immediately.'
                : 'Development payment: no real money is processed. The booking is confirmed once the simulated payment succeeds.'}
            </p>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold">Price summary</h2>

            {quoteKey === '' && (
              <p className="text-sm text-slate-600">
                Choose two different branches, a category and a weight to see the price.
              </p>
            )}
            {quoteLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600" role="status">
                <Spinner /> Calculating...
              </div>
            )}
            {shownQuote?.error && (
              <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {shownQuote.error}
              </p>
            )}
            {shownQuote?.quote && <CostBreakdown quote={shownQuote.quote} />}

            <Button type="submit" loading={isSubmitting} className="w-full">
              {shownQuote?.quote ? `Book parcel (${formatINR(shownQuote.quote.total_amount)})` : 'Book parcel'}
            </Button>
            <p className="text-xs text-slate-500">The final price is recalculated by the server when you book.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}