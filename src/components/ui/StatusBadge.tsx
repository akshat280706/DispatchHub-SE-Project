// import { formatStatus } from '../../lib/format'

// const TONES: Record<string, string> = {
//   DELIVERED: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
//   OUT_FOR_DELIVERY: 'bg-brand-50 text-brand-700 ring-brand-600/20',
//   AT_DESTINATION_BRANCH: 'bg-sky-50 text-sky-800 ring-sky-600/20',
//   IN_TRANSIT: 'bg-sky-50 text-sky-800 ring-sky-600/20',
//   PICKED_UP: 'bg-sky-50 text-sky-800 ring-sky-600/20',
//   ASSIGNED: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
//   CONFIRMED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
//   BOOKED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
//   DELIVERY_FAILED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
//   RETURNED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
//   CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
//   SUCCESS: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
//   PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
//   FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
//   REFUNDED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
//   OPEN: 'bg-amber-50 text-amber-800 ring-amber-600/20',
//   IN_REVIEW: 'bg-sky-50 text-sky-800 ring-sky-600/20',
//   RESOLVED: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
//   CLOSED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
// }

// export default function StatusBadge({ status }: { status: string }) {
//   const tone = TONES[status] ?? 'bg-slate-100 text-slate-700 ring-slate-500/20'
//   return (
//     <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
//       {formatStatus(status)}
//     </span>
//   )
// }

import { formatStatus } from '../../lib/format'

// Colour groups: done = green, active = lime, in motion = navy tint, waiting = grey, attention = amber, problem = red
const GREEN = 'bg-emerald-50 text-emerald-800 ring-emerald-600/25'
const LIME = 'bg-brand-100 text-navy-900 ring-lime-dark/60'
const NAVY = 'bg-slate-100 text-navy-800 ring-navy-800/20'
const GREY = 'bg-slate-100 text-slate-600 ring-slate-400/30'
const AMBER = 'bg-amber-50 text-amber-800 ring-amber-600/30'
const RED = 'bg-red-50 text-red-700 ring-red-600/25'

const TONES: Record<string, string> = {
  DELIVERED: GREEN,
  SUCCESS: GREEN,
  RESOLVED: GREEN,
  OUT_FOR_DELIVERY: LIME,
  IN_REVIEW: LIME,
  AT_DESTINATION_BRANCH: NAVY,
  IN_TRANSIT: NAVY,
  PICKED_UP: NAVY,
  ASSIGNED: NAVY,
  CONFIRMED: GREY,
  BOOKED: GREY,
  CLOSED: GREY,
  REFUNDED: GREY,
  PENDING: AMBER,
  OPEN: AMBER,
  DELIVERY_FAILED: AMBER,
  RETURNED: AMBER,
  CANCELLED: RED,
  FAILED: RED,
}

export default function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? GREY
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {formatStatus(status)}
    </span>
  )
}
