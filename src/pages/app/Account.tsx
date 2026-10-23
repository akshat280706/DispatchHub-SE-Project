import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import ChangePasswordForm from '../../components/domain/ChangePasswordForm'
import { ROLE_LABEL } from '../../lib/navigation'
import { customerRoutes } from '../../lib/parcel'

export default function Account() {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-slate-600">Your sign-in details and password.</p>
      </div>

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Name</dt>
          <dd className="font-medium">{profile.full_name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium">{ROLE_LABEL[profile.role]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium">{profile.email}</dd>
        </div>
      </dl>
      {profile.role === 'CUSTOMER' && (
        <p className="text-sm">
          <Link to={customerRoutes.profile} className="font-medium text-brand-700 hover:underline">
            Edit your contact details
          </Link>
        </p>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold">Change password</h2>
        <ChangePasswordForm email={profile.email} />
      </section>
    </div>
  )
}
