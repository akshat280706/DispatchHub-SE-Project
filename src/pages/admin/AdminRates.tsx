import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Plus } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminConfigService } from '../../services/adminConfigService'
import type { RateRow } from '../../services/adminConfigService'
import { rateSchema } from '../../schemas/adminConfig'
import type { RateInput } from '../../schemas/adminConfig'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import ActiveBadge from '../../components/ui/ActiveBadge'
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from '../../lib/parcel'
import { formatINR } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { RateZone } from '../../types/database'

const ZONES: RateZone[] = ['LOCAL', 'REGIONAL', 'NATIONAL']
const ZONE_NAME: Record<RateZone, string> = { LOCAL: 'Local', REGIONAL: 'Regional', NATIONAL: 'National' }

interface RateFormProps {
  rate: RateRow | null
  onClose: () => void
  onSaved: () => void
}

function RateForm({ rate, onClose, onSaved }: RateFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RateInput>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      zone: rate?.zone ?? '',
      category: rate?.category ?? '',
      base_charge: rate ? String(rate.base_charge) : '',
      base_weight_kg: rate ? String(rate.base_weight_kg) : '1',
      per_kg_charge: rate ? String(rate.per_kg_charge) : '',
      handling_surcharge: rate ? String(rate.handling_surcharge) : '0',
      is_active: rate?.is_active ?? true,
    },
  })

  async function submit(values: RateInput) {
    setFormError(null)
    try {
      // Zone and category of an existing rate are fixed
      await adminConfigService.saveRate(rate?.id ?? null, rate ? { ...values, zone: rate.zone, category: rate.category } : values)
      onSaved()
    } catch (e) {
      setFormError(getErrorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      {rate ? (
        <p className="text-sm">
          <span className="font-medium">{ZONE_NAME[rate.zone]}</span> · <span className="font-medium">{CATEGORY_LABEL[rate.category]}</span>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Zone" error={errors.zone?.message} {...register('zone')}>
            <option value="">Select zone</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_NAME[z]}
              </option>
            ))}
          </Select>
          <Select label="Category" error={errors.category?.message} {...register('category')}>
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Base charge (INR)" inputMode="decimal" error={errors.base_charge?.message} {...register('base_charge')} />
        <Input label="Base weight (kg)" inputMode="decimal" hint="Weight covered by the base charge" error={errors.base_weight_kg?.message} {...register('base_weight_kg')} />
        <Input label="Per extra 1 kg (INR)" inputMode="decimal" hint="Charged per 0.5 kg step, rounded up" error={errors.per_kg_charge?.message} {...register('per_kg_charge')} />
        <Input label="Handling surcharge (INR)" inputMode="decimal" error={errors.handling_surcharge?.message} {...register('handling_surcharge')} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('is_active')} /> Rate is active
      </label>
      <p className="text-xs text-slate-600">
        Changes apply to new quotes and bookings only. Existing parcels keep the charges they were booked with. A parcel cannot be
        booked for a zone and category that has no active rate.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {rate ? 'Save changes' : 'Create rate'}
        </Button>
      </div>
    </form>
  )
}

export default function AdminRates() {
  const { data, error, loading, reload } = useAsyncData('admin-rates', () => adminConfigService.listRates())
  const [editing, setEditing] = useState<RateRow | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const missing: string[] = []
  if (data) {
    const active = new Set(data.filter((r) => r.is_active).map((r) => `${r.zone}:${r.category}`))
    for (const z of ZONES) {
      for (const c of CATEGORY_OPTIONS) {
        if (!active.has(`${z}:${c.value}`)) missing.push(`${ZONE_NAME[z]} / ${c.label}`)
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Shipping rates</h1>
          <p className="text-sm text-slate-600">
            Charge = base + extra weight (per 0.5 kg step) + handling, then GST from Settings.
          </p>
        </div>
        <Button onClick={() => { setNotice(null); setEditing('new') }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add rate
        </Button>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </p>
      )}
      {missing.length > 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No active rate for: {missing.join(', ')}. Customers cannot book those combinations.
        </p>
      )}
      {loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Zone</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3 text-right">Base</th>
                <th scope="col" className="px-4 py-3 text-right">Base weight</th>
                <th scope="col" className="px-4 py-3 text-right">Per extra kg</th>
                <th scope="col" className="px-4 py-3 text-right">Handling</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{ZONE_NAME[r.zone]}</td>
                  <td className="px-4 py-3">{CATEGORY_LABEL[r.category]}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.base_charge)}</td>
                  <td className="px-4 py-3 text-right">{r.base_weight_kg} kg</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.per_kg_charge)}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.handling_surcharge)}</td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={r.is_active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" onClick={() => { setNotice(null); setEditing(r) }}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? 'Add rate' : 'Edit rate'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <RateForm
            key={editing === 'new' ? 'new' : editing.id}
            rate={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setNotice('Rate saved. It applies to new quotes and bookings.')
              setEditing(null)
              reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
