import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Plus } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminConfigService } from '../../services/adminConfigService'
import type { AdminBranch } from '../../services/adminConfigService'
import { branchSchema } from '../../schemas/adminConfig'
import type { BranchInput } from '../../schemas/adminConfig'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import ActiveBadge from '../../components/ui/ActiveBadge'
import { getErrorMessage } from '../../lib/errors'

interface BranchFormProps {
  branch: AdminBranch | null
  onClose: () => void
  onSaved: (name: string) => void
}

function BranchForm({ branch, onClose, onSaved }: BranchFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      code: branch?.code ?? '',
      name: branch?.name ?? '',
      city: branch?.city ?? '',
      state: branch?.state ?? '',
      address: branch?.address ?? '',
      pincode: branch?.pincode ?? '',
      phone: branch?.phone ?? '',
      is_active: branch?.is_active ?? true,
    },
  })

  async function submit(values: BranchInput) {
    setFormError(null)
    try {
      await adminConfigService.saveBranch(branch?.id ?? null, values)
      onSaved(values.name)
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Code" hint="e.g. HYD01" error={errors.code?.message} {...register('code')} />
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="City" error={errors.city?.message} {...register('city')} />
        <Input label="State" error={errors.state?.message} {...register('state')} />
      </div>
      <Input label="Address (optional)" error={errors.address?.message} {...register('address')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Pincode (optional)" inputMode="numeric" maxLength={6} error={errors.pincode?.message} {...register('pincode')} />
        <Input label="Phone (optional)" type="tel" error={errors.phone?.message} {...register('phone')} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('is_active')} /> Branch is active
      </label>
      <p className="text-xs text-slate-600">
        City and state decide the pricing zone for future bookings. Inactive branches cannot be chosen when booking. A branch
        can only be deactivated when it has no active staff and no parcels in progress.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {branch ? 'Save changes' : 'Create branch'}
        </Button>
      </div>
    </form>
  )
}

export default function AdminBranches() {
  const { data, error, loading, reload } = useAsyncData('admin-branches', () => adminConfigService.listBranches())
  const [editing, setEditing] = useState<AdminBranch | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Branches</h1>
          <p className="text-sm text-slate-600">Create and edit the branches that parcels move between.</p>
        </div>
        <Button onClick={() => { setNotice(null); setEditing('new') }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add branch
        </Button>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Code</th>
                <th scope="col" className="px-4 py-3">Branch</th>
                <th scope="col" className="px-4 py-3">Location</th>
                <th scope="col" className="px-4 py-3">Phone</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono font-medium">{b.code}</td>
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.city}, {b.state}
                    {b.pincode ? ` ${b.pincode}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.phone ?? '-'}</td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={b.is_active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" onClick={() => { setNotice(null); setEditing(b) }}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? 'Add branch' : 'Edit branch'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <BranchForm
            key={editing === 'new' ? 'new' : editing.id}
            branch={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(name) => {
              setNotice(`Branch "${name}" was saved.`)
              setEditing(null)
              reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
