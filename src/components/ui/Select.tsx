import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className = '', children, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${selectId}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

export default Select