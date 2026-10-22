import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAsyncData } from '../../hooks/useAsyncData'
import { reportService } from '../../services/reportService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { PARCEL_STATUSES } from '../../lib/constants'
import { formatDate, formatStatus } from '../../lib/format'

const TEAL = '#0e8f88'
const NAVY = '#162a4a'

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function ManagerReports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rangeInvalid = from !== '' && to !== '' && from > to

  const { data, error, loading } = useAsyncData(`branch-report:${from}:${to}:${rangeInvalid}`, async () =>
    rangeInvalid ? null : reportService.branch(from, to),
  )

  const statusData = data
    ? PARCEL_STATUSES.filter((s) => data.by_status[s]).map((s) => ({ label: formatStatus(s), count: data.by_status[s] }))
    : []
  const personnelData = data ? data.personnel.map((p) => ({ name: p.full_name, active: p.active_assignments })) : []
  const dailyTotal = data ? data.daily.reduce((sum, d) => sum + d.bookings, 0) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branch reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data ? `${data.branch.name} (${data.branch.code}). ` : ''}
          Showing {data ? `${formatDate(data.from)} to ${formatDate(data.to)}` : 'the last 30 days'}. Leave the dates empty for the
          last 30 days.
        </p>
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
            <StatCard label="Parcels in period" value={data.parcel_count} />
            <StatCard label="Pending assignments" value={data.pending_assignments} hint="Right now" />
            <StatCard label="In transit" value={data.in_transit} hint="Right now" />
            <StatCard label="Delayed" value={data.delayed} hint="Past the estimated date, right now" />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Bookings per day</h2>
            <p className="text-xs text-slate-500">Parcels that start or end at your branch, by booking date.</p>
            {dailyTotal === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No bookings in this period.</p>
            ) : (
              <div className="mt-4 h-64" role="img" aria-label="Line chart of bookings per day">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold">Parcels by status</h2>
              {statusData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No parcels in this period.</p>
              ) : (
                <div className="mt-4" style={{ height: Math.max(200, statusData.length * 36) }} role="img" aria-label="Bar chart of parcels by status">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 8 }}>
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
              <h2 className="text-base font-semibold">Rider workload (active assignments)</h2>
              {personnelData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No delivery personnel in this branch.</p>
              ) : (
                <div className="mt-4 h-56" role="img" aria-label="Bar chart of active assignments per rider">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personnelData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                      <Tooltip />
                      <Bar dataKey="active" name="Active" fill={TEAL} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <h3 className="mt-6 text-sm font-medium">Complaints on this branch's parcels</h3>
              {Object.keys(data.complaints).length === 0 ? (
                <p className="mt-1 text-sm text-slate-600">None.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
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
        </>
      )}
    </div>
  )
}