import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { PARCEL_STATUSES } from '../../lib/constants'
import { adminRoutes } from '../../lib/admin'
import { ROLE_LABEL } from '../../lib/navigation'
import { formatDate, formatINR, formatStatus } from '../../lib/format'
import type { UserRole } from '../../types/database'

const TEAL = '#0e8f88'
const NAVY = '#162a4a'
const shortDate = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rangeInvalid = from !== '' && to !== '' && from > to

  const { data, error, loading } = useAsyncData(`admin-dashboard:${from}:${to}:${rangeInvalid}`, async () =>
    rangeInvalid ? null : reportService.admin(from, to),
  )

  const bookingsTotal = data ? data.daily.reduce((s, d) => s + d.bookings, 0) : 0
  const revenueTotal = data ? data.daily.reduce((s, d) => s + Number(d.revenue), 0) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {profile?.full_name}</h1>
          <p className="text-sm text-slate-600">System overview. Date filters apply to the range-based figures.</p>
        </div>
        <Link
          to={adminRoutes.users}
          className="inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Manage users
        </Link>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="flex items-end">
          <Button
            variant="ghost"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
            disabled={from === '' && to === ''}
          >
            Reset to last 30 days
          </Button>
        </div>
      </div>

      {rangeInvalid && (
        <p role="alert" className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          The start date must be on or before the end date.
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={data.users.total} hint={`${data.users.active} active`} />
            <StatCard label="Total parcels" value={data.parcels.total} hint="All time" />
            <StatCard label="Active shipments" value={data.parcels.active} hint={`${data.parcels.delayed} delayed`} />
            <StatCard label="Delivered" value={data.parcels.delivered} hint={`${data.parcels.cancelled} cancelled`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Payments received" value={formatINR(data.payments.success_amount)} hint={`${data.payments.success_count} payments, in range`} />
            <StatCard label="Pending payments" value={formatINR(data.payments.pending_amount)} hint={`${data.payments.pending_count} payments, in range`} />
            <StatCard label="Refunded (records)" value={formatINR(data.payments.refunded_amount)} hint={`${data.payments.refunded_count} payments, in range`} />
            <StatCard label="Parcels in range" value={data.parcels.in_range} hint={`${formatDate(data.from)} to ${formatDate(data.to)}`} />
          </div>
          <p className="text-xs text-slate-500">
            Payment totals include development payments and cash records. No real money is processed in development mode.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Bookings per day</h2>
              {bookingsTotal === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No bookings in this period.</p>
              ) : (
                <div className="mt-4 h-56" role="img" aria-label="Line chart of bookings per day">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                      <Tooltip labelFormatter={(v) => formatDate(String(v))} />
                      <Line type="monotone" dataKey="bookings" name="Bookings" stroke={TEAL} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Revenue per day (INR)</h2>
              {revenueTotal === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No successful payments in this period.</p>
              ) : (
                <div className="mt-4 h-56" role="img" aria-label="Line chart of revenue per day">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} minTickGap={24} />
                      <YAxis tick={{ fontSize: 12 }} width={48} />
                      <Tooltip labelFormatter={(v) => formatDate(String(v))} formatter={(v) => formatINR(Number(v))} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke={NAVY} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Users by role</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                  <li key={r} className="flex justify-between">
                    <span className="text-slate-600">{ROLE_LABEL[r]}</span>
                    <span className="font-medium">{data.users.by_role[r] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Parcels by status (in range)</h2>
              {Object.keys(data.parcels.by_status).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No parcels in this period.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {PARCEL_STATUSES.filter((s) => data.parcels.by_status[s]).map((s) => (
                    <li key={s} className="flex justify-between">
                      <span className="text-slate-600">{formatStatus(s)}</span>
                      <span className="font-medium">{data.parcels.by_status[s]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Complaints (all time)</h2>
              {Object.keys(data.complaints).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No complaints.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].filter((s) => data.complaints[s]).map((s) => (
                    <li key={s} className="flex justify-between">
                      <span className="text-slate-600">{formatStatus(s)}</span>
                      <span className="font-medium">{data.complaints[s]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Branches</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Branch</th>
                    <th scope="col" className="px-4 py-2 text-right">Outgoing (range)</th>
                    <th scope="col" className="px-4 py-2 text-right">Incoming (range)</th>
                    <th scope="col" className="py-2 pl-4 text-right">Active now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.branches.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2 pr-4">
                        <span className="font-medium">{b.name}</span>
                        <span className="block text-xs text-slate-500">
                          {b.code} · {b.city}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{b.origin_parcels}</td>
                      <td className="px-4 py-2 text-right">{b.destination_parcels}</td>
                      <td className="py-2 pl-4 text-right">{b.active_parcels}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}