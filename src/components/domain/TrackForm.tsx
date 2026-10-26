// import { useState } from 'react'
// import type { FormEvent } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Search } from 'lucide-react'
// import Button from '../ui/Button'
// import { isValidTrackingNumber, normalizeTrackingNumber } from '../../services/trackingService'
// import { trackRoute } from '../../app/routes'

// export default function TrackForm({ initialValue = '' }: { initialValue?: string }) {
//   const navigate = useNavigate()
//   const [value, setValue] = useState(initialValue)
//   const [error, setError] = useState<string | null>(null)

//   function onSubmit(e: FormEvent) {
//     e.preventDefault()
//     const n = normalizeTrackingNumber(value)
//     if (!isValidTrackingNumber(n)) {
//       setError('Enter a valid tracking number (letters and numbers only).')
//       return
//     }
//     setError(null)
//     navigate(trackRoute(n))
//   }

//   return (
//     <form onSubmit={onSubmit} noValidate>
//       <label htmlFor="tracking-number" className="mb-1 block text-sm font-medium text-slate-700">
//         Tracking number
//       </label>
//       <div className="flex gap-2">
//         <input
//           id="tracking-number"
//           value={value}
//           onChange={(e) => setValue(e.target.value)}
//           placeholder="DH261020XXXXXX"
//           autoComplete="off"
//           aria-invalid={error ? true : undefined}
//           aria-describedby={error ? 'tracking-error' : undefined}
//           className={`block w-full rounded-md border bg-white px-3 py-2 text-sm uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 ${
//             error ? 'border-red-500' : 'border-slate-300'
//           }`}
//         />
//         <Button type="submit">
//           <Search className="h-4 w-4" aria-hidden="true" />
//           Track
//         </Button>
//       </div>
//       {error && (
//         <p id="tracking-error" role="alert" className="mt-1 text-xs text-red-600">
//           {error}
//         </p>
//       )}
//     </form>
//   )
// }

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Button from '../ui/Button'
import { isValidTrackingNumber, normalizeTrackingNumber } from '../../services/trackingService'
import { trackRoute } from '../../app/routes'

export default function TrackForm({ initialValue = '' }: { initialValue?: string }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n = normalizeTrackingNumber(value)
    if (!isValidTrackingNumber(n)) {
      setError('Enter a valid tracking number (letters and numbers only).')
      return
    }
    setError(null)
    navigate(trackRoute(n))
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="tracking-number" className="mb-1 block text-sm font-medium text-slate-700">
        Tracking number
      </label>
      <div className="flex gap-2">
        <input
          id="tracking-number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="DH261020XXXXXX"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'tracking-error' : undefined}
          className={`block w-full rounded-md border bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 ${
            error ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Track
        </Button>
      </div>
      {error && (
        <p id="tracking-error" role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  )
}