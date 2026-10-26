// import type { ButtonHTMLAttributes } from 'react'
// import { Loader2 } from 'lucide-react'

// type Variant = 'primary' | 'secondary' | 'ghost'

// interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
//   variant?: Variant
//   loading?: boolean
// }

// const styles: Record<Variant, string> = {
//   primary: 'bg-brand-600 text-white hover:bg-brand-700',
//   secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
//   ghost: 'text-slate-700 hover:bg-slate-100',
// }

// export default function Button({
//   variant = 'primary',
//   loading = false,
//   disabled,
//   className = '',
//   children,
//   type = 'button',
//   ...rest
// }: ButtonProps) {
//   return (
//     <button
//       type={type}
//       disabled={disabled || loading}
//       className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
//       {...rest}
//     >
//       {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
//       {children}
//     </button>
//   )
// }

import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  accent: 'bg-lime text-navy-900 hover:bg-lime-dark',
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}