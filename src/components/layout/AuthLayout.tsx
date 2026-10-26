// import type { ReactNode } from 'react'
// import { Link } from 'react-router-dom'
// import { COPYRIGHT_TEXT } from '../../lib/constants'
// import { ROUTES } from '../../app/routes'

// interface AuthLayoutProps {
//   title: string
//   subtitle: string
//   children: ReactNode
// }

// export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
//   return (
//     <div className="flex min-h-screen flex-col">
//       <header className="bg-navy-900">
//         <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
//           <Link to={ROUTES.home} className="text-lg font-semibold tracking-tight text-white">
//             Dispatch<span className="text-brand-500">Hub</span>
//           </Link>
//         </div>
//       </header>

//       <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
//         <h1 className="text-2xl font-semibold">{title}</h1>
//         <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
//         <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">{children}</div>
//       </main>

//       <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
//         {COPYRIGHT_TEXT}
//       </footer>
//     </div>
//   )
// }

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { COPYRIGHT_TEXT } from '../../lib/constants'
import { ROUTES } from '../../app/routes'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link to={ROUTES.home} className="text-lg font-semibold tracking-tight text-white">
            Dispatch<span className="text-lime">Hub</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <span className="mb-4 block h-1 w-10 rounded-full bg-lime" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
        {COPYRIGHT_TEXT}
      </footer>
    </div>
  )
}
