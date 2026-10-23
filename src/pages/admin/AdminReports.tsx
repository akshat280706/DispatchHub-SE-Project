import { useState } from 'react'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import { branchService } from '../../services/branchService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { PARCEL_STATUSES } from '../../lib/constants'
import { formatDate, formatINR, formatStatus } from '../../lib/format'
import type { AdminStats } from '../../types/api'

const TEAL = '#0e8f88'
const NAVY = '#162a4a'
const shortDate = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

function downloadCsv(stats: AdminStats) {
  const lines = ['date,bookings,revenue_inr', ...stats.daily.map((d) => `${d.date},${d.bookings},${d.revenue}`)]
  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dispatchhub-daily-${stats.from}-to-${stats.to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [branchId, setBranchId] = useState('')
  const rangeInvalid = from !== '' && to !== '' && from > to

  const branches = useAsyncData('branches', () => branchService.listActive())
  const { data, error, loading } = useAsyncData(`admin-report:${from}:${to}:${branchId}:${rangeInvalid}`, async () => {
    if (rangeInvalid) return null
    const [system, branch] = await Promise.all([
      reportService.admin(from, to),
      branchId ? reportService.branch(from, to, branchId) : Promise.resolve(null),
    ])
    return { system, branch }
  })

  const sys = data?.system
  const branchBars = sys ? sys.branches.map((b) => ({ name: b.code, Outgoing: b.origin_parcels, Incoming: b.destination_parcels })) : []
  const statusBars = sys
    ? PARCEL_STATUSES.filter((s) => sys.parcels.by_status[s]).map((s) => ({ label: formatStatus(s), count: sys.parcels.by_status[s] }))
    : []
  const paymentBars = sys
    ? [
        { label: 'Success', count: sys.payments.success_count },
        { label: 'Pending', count: sys.payments.pending_count },
        { label: 'Failed', count: sys.payments.failed_count },
        { label: 'Refunded', count: sys.payments.refunded_count },
      ]
    : []
  const revenueTotal = sys ? sys.daily.reduce((s, d) => s + Number(d.revenue), 0) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          {sys ? `${formatDate(sys.from)} to ${formatDate(sys.to)}.` : 'Last 30 days.'} Leave the dates empty for the last 30 days.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select label="Branch drill-down" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">System-wide only</option>
          {(branches.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
        <div className="flex items-end gap-2">
          <Button variant="ghost" onClick={() => { setFrom(''); setTo(''); setBranchId('') }} disabled={from === '' && to === '' && branchId === ''}>
            Reset
          </Button>
          {sys && (
            <Button variant="secondary" onClick={() => downloadCsv(sys)}>
              <Download className="h-4 w-4" aria-hidden="true" /> CSV
            </Button>
          )}
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

      {sys && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Parcels in range" value={sys.parcels.in_range} />
            <StatCard label="Revenue (recorded)" value={formatINR(sys.payments.success_amount)} hint="Includes development and cash records" />
            <StatCard label="Active shipments" value={sys.parcels.active} hint={`${sys.parcels.delayed} delayed`} />
            <StatCard label="Delivered (all time)" value={sys.parcels.delivered} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Revenue per day (INR)</h2>
            {revenueTotal === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No successful payments in this period.</p>
            ) : (
              <div className="mt-4 h-60" role="img" aria-label="Line chart of revenue per day">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sys.daily} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
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

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Parcels by branch (in range)</h2>
              {branchBars.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No branches.</p>
              ) : (
                <div className="mt-4 h-64" role="img" aria-label="Bar chart of outgoing and incoming parcels per branch">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchBars} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Outgoing" fill={TEAL} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Incoming" fill={NAVY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Payments by outcome (in range)</h2>
              <div className="mt-4 h-64" role="img" aria-label="Bar chart of payments by outcome">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentBars} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                    <Tooltip />
                    <Bar dataKey="count" name="Payments" fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Parcels by status (in range)</h2>
              {statusBars.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No parcels in this period.</p>
              ) : (
                <div className="mt-4" style={{ height: Math.max(200, statusBars.length * 36) }} role="img" aria-label="Bar chart of parcels by status">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBars} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Parcels" fill={NAVY} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Complaints (all time)</h2>
              {Object.keys(sys.complaints).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No complaints.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].filter((s) => sys.complaints[s]).map((s) => (
                    <li key={s} className="flex justify-between">
                      <span className="text-slate-600">{formatStatus(s)}</span>
                      <span className="font-medium">{sys.complaints[s]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {data?.branch && (
            <section className="rounded-lg border border-brand-600/30 bg-brand-50 p-5">
              <h2 className="text-base font-semibold">
                Branch: {data.branch.branch.name} ({data.branch.branch.code})
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Parcels in range" value={data.branch.parcel_count} />
                <StatCard label="Pending assignments" value={data.branch.pending_assignments} hint="Right now" />
                <StatCard label="In transit" value={data.branch.in_transit} hint="Right now" />
                <StatCard label="Delayed" value={data.branch.delayed} hint="Right now" />
              </div>
              <h3 className="mt-5 text-sm font-medium">Delivery personnel</h3>
              {data.branch.personnel.length === 0 ? (
                <p className="mt-1 text-sm text-slate-600">No active delivery personnel in this branch.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.branch.personnel.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span>{p.full_name}</span>
                      <span className="text-slate-600">
                        {p.active_assignments} active · {p.is_available ? 'available' : 'unavailable'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
