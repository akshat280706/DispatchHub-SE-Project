// import type { TrackingEvent } from '../../types/tracking'
// import { formatDateTime, formatStatus } from '../../lib/format'

// // Newest event first. The latest step is highlighted.
// export default function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
//   const ordered = [...events].reverse()

//   if (ordered.length === 0) {
//     return <p className="text-sm text-slate-600">No tracking events have been recorded yet.</p>
//   }

//   return (
//     <ol aria-label="Tracking history">
//       {ordered.map((e, i) => (
//         <li key={`${e.occurred_at}-${i}`} className="relative pb-6 pl-8 last:pb-0">
//           {i < ordered.length - 1 && (
//             <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden="true" />
//           )}
//           <span
//             className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${
//               i === 0 ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
//             }`}
//             aria-hidden="true"
//           />
//           <p className="text-sm font-semibold text-slate-900">{formatStatus(e.status)}</p>
//           {e.description && <p className="mt-0.5 text-sm text-slate-600">{e.description}</p>}
//           <p className="mt-0.5 text-xs text-slate-500">
//             {formatDateTime(e.occurred_at)}
//             {e.branch_city ? ` · ${e.branch_city}` : ''}
//           </p>
//         </li>
//       ))}
//     </ol>
//   )
// }

import type { TrackingEvent } from '../../types/tracking'
import { formatDateTime, formatStatus } from '../../lib/format'

// Newest event first. The latest step is highlighted in lime.
export default function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  const ordered = [...events].reverse()

  if (ordered.length === 0) {
    return <p className="text-sm text-slate-500">No tracking events have been recorded yet.</p>
  }

  return (
    <ol aria-label="Tracking history">
      {ordered.map((e, i) => (
        <li key={`${e.occurred_at}-${i}`} className="relative pb-6 pl-8 last:pb-0">
          {i < ordered.length - 1 && (
            <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden="true" />
          )}
          <span
            className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${
              i === 0 ? 'border-navy-900 bg-lime' : 'border-slate-300 bg-white'
            }`}
            aria-hidden="true"
          />
          <p className={`text-sm ${i === 0 ? 'font-semibold text-navy-900' : 'font-medium text-slate-700'}`}>
            {formatStatus(e.status)}
          </p>
          {e.description && <p className="mt-0.5 text-sm text-slate-600">{e.description}</p>}
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(e.occurred_at)}
            {e.branch_city ? ` · ${e.branch_city}` : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}
