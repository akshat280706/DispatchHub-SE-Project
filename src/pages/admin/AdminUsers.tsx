import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebounce } from '../../hooks/useDebounce'
import { adminService } from '../../services/adminService'
import type { AdminUser, UserFilters } from '../../services/adminService'
import { branchService } from '../../services/branchService'
import { createStaffSchema } from '../../schemas/user'
import type { CreateStaffInput } from '../../schemas/user'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { ROLE_OPTIONS, needsBranch } from '../../lib/admin'
import { ROLE_LABEL } from '../../lib/navigation'
import { formatDate } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { Branch, UserRole } from '../../types/database'

const PAGE_SIZE = 10

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-slate-500/20'
      }`}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  )
}

/* ---------------- Edit dialog ---------------- */

interface EditFormProps {
  user: AdminUser
  isSelf: boolean
  branches: Branch[]
  onClose: () => void
  onSaved: () => void
}

function EditForm({ user, isSelf, branches, onClose, onSaved }: EditFormProps) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [branchId, setBranchId] = useState(user.branch_id ?? '')
  const [active, setActive] = useState(user.is_active)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (needsBranch(role) && branchId === '') {
      setError('Select a branch for this role.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await adminService.updateUser(user.id, role, needsBranch(role) ? branchId : null, active)
      onSaved()
    } catch (e) {
      setError(getErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{user.full_name}</p>
        <p className="text-sm text-slate-600">{user.email}</p>
      </div>
      {isSelf && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This is your own account. You cannot change your role or deactivate yourself.
        </p>
      )}
      <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isSelf}>
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      {needsBranch(role) && (
        <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Select a branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isSelf} />
        Account is active
      </label>
      {!active && <p className="text-xs text-slate-600">Deactivated users are blocked by the database and cannot sign in to the app.</p>}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void save()} loading={busy}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

/* ---------------- Create staff dialog ---------------- */

interface CreateFormProps {
  branches: Branch[]
  onClose: () => void
  onCreated: (email: string) => void
}

function CreateStaffForm({ branches, onClose, onCreated }: CreateFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { full_name: '', email: '', phone: '', role: 'DELIVERY_PERSONNEL', branch_id: '', password: '' },
  })
  const role = useWatch({ control, name: 'role' })

  async function submit(values: CreateStaffInput) {
    setFormError(null)
    try {
      await adminService.createStaff(values)
      onCreated(values.email)
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
      <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
      <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone (optional)" type="tel" error={errors.phone?.message} {...register('phone')} />
      <Select label="Role" error={errors.role?.message} {...register('role')}>
        {ROLE_OPTIONS.filter((r) => r.value !== 'CUSTOMER').map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      {role !== 'ADMIN' && (
        <Select label="Branch" error={errors.branch_id?.message} {...register('branch_id')}>
          <option value="">Select a branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
      )}
      <Input
        label="Temporary password"
        type="text"
        autoComplete="off"
        hint="At least 8 characters, with a letter and a number. Share it securely with the person."
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create account
        </Button>
      </div>
    </form>
  )
}

/* ---------------- Page ---------------- */

export default function AdminUsers() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const debounced = useDebounce(search, 400)
  const hasFilters = search !== '' || role !== '' || status !== ''
  const filters: UserFilters = { search: debounced, role, status, page, pageSize: PAGE_SIZE }

  const branches = useAsyncData('branches', () => branchService.listActive())
  const list = useAsyncData(`admin-users:${JSON.stringify(filters)}`, () => adminService.listUsers(filters))
  const branchName = (id: string | null) => (id ? (branches.data?.find((b) => b.id === id)?.code ?? '-') : '-')

  function clear() {
    setSearch('')
    setRole('')
    setStatus('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-slate-600">Create staff accounts and manage roles, branches and access.</p>
        </div>
        <Button onClick={() => { setNotice(null); setCreating(true) }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Create staff account
        </Button>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </p>
      )}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Search"
          placeholder="Name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as UserRole | '')
            setPage(1)
          }}
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | 'active' | 'inactive')
            setPage(1)
          }}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" onClick={clear}>
          Clear filters
        </Button>
      )}

      {list.loading && (
        <div className="flex justify-center py-10" role="status">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {list.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {list.error}
        </p>
      )}
      {list.data && list.data.data.length === 0 && (
        <EmptyState title={hasFilters ? 'No users match your filters' : 'No users'} text="Try a different search or clear the filters." />
      )}
      {list.data && list.data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Branch</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.data.data.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {u.full_name}
                        {u.id === profile?.id && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3 text-slate-600">{branchName(u.branch_id)}</td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={u.is_active} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => { setNotice(null); setEditing(u) }}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onChange={setPage} />
        </>
      )}

      <Modal open={editing !== null} title="Edit user" onClose={() => setEditing(null)}>
        {editing && (
          <EditForm
            key={editing.id}
            user={editing}
            isSelf={editing.id === profile?.id}
            branches={branches.data ?? []}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setNotice(`${editing.full_name} was updated.`)
              setEditing(null)
              list.reload()
            }}
          />
        )}
      </Modal>

      <Modal open={creating} title="Create staff account" onClose={() => setCreating(false)}>
        <CreateStaffForm
          branches={branches.data ?? []}
          onClose={() => setCreating(false)}
          onCreated={(email) => {
            setNotice(`Account created for ${email}. Share the temporary password securely.`)
            setCreating(false)
            setPage(1)
            list.reload()
          }}
        />
      </Modal>
    </div>
  )
}
