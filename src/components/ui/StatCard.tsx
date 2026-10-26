// export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200 bg-white p-4">
//       <p className="text-sm text-slate-500">{label}</p>
//       <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
//       {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
//     </div>
//   )
// }

export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

