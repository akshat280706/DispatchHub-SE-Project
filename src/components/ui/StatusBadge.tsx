import { formatStatus } from '../../lib/format'

const TONES: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  OUT_FOR_DELIVERY: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  AT_DESTINATION_BRANCH: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  IN_TRANSIT: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  PICKED_UP: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  ASSIGNED: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
  CONFIRMED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  BOOKED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  DELIVERY_FAILED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  RETURNED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
}

export default function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? 'bg-slate-100 text-slate-700 ring-slate-500/20'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {formatStatus(status)}
    </span>
  )
}