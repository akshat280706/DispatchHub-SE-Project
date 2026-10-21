import type { ReactNode } from 'react'

export default function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}