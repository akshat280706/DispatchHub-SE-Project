import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <div>
      <label htmlFor={areaId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        ref={ref}
        id={areaId}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${areaId}-error` : undefined}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${areaId}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

export default Textarea