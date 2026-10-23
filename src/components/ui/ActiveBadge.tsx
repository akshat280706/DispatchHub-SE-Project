export default function ActiveBadge({ active, on = 'Active', off = 'Inactive' }: { active: boolean; on?: string; off?: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-slate-500/20'
      }`}
    >
      {active ? on : off}
    </span>
  )
}
