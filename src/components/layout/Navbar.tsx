// import { useState } from 'react'
// import { Link, NavLink } from 'react-router-dom'
// import { Menu, X } from 'lucide-react'
// import { ROUTES } from '../../app/routes'
// import { useAuth } from '../../hooks/useAuth'
// import { ROLE_HOME } from '../../lib/navigation'

// const LINKS = [
//   { label: 'About', to: ROUTES.about },
//   { label: 'Services', to: ROUTES.services },
//   { label: 'Track parcel', to: ROUTES.track },
//   { label: 'Contact', to: ROUTES.contact },
// ]

// export default function Navbar() {
//   const { profile } = useAuth()
//   const [open, setOpen] = useState(false)

//   const linkClass = ({ isActive }: { isActive: boolean }) =>
//     `rounded-md px-3 py-2 text-sm font-medium ${
//       isActive ? 'bg-navy-700 text-white' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
//     }`

//   return (
//     <header className="sticky top-0 z-30 bg-navy-900">
//       <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
//         <Link to={ROUTES.home} className="text-lg font-semibold tracking-tight text-white" onClick={() => setOpen(false)}>
//           Dispatch<span className="text-brand-500">Hub</span>
//         </Link>

//         <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
//           {LINKS.map((l) => (
//             <NavLink key={l.to} to={l.to} className={linkClass}>
//               {l.label}
//             </NavLink>
//           ))}
//         </nav>

//         <div className="hidden items-center gap-3 md:flex">
//           {profile ? (
//             <Link to={ROLE_HOME[profile.role]} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
//               Dashboard
//             </Link>
//           ) : (
//             <>
//               <Link to={ROUTES.login} className="text-sm font-medium text-slate-300 hover:text-white">
//                 Login
//               </Link>
//               <Link to={ROUTES.register} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
//                 Register
//               </Link>
//             </>
//           )}
//         </div>

//         <button
//           className="rounded p-2 text-slate-200 hover:bg-navy-800 md:hidden"
//           onClick={() => setOpen((v) => !v)}
//           aria-label={open ? 'Close menu' : 'Open menu'}
//           aria-expanded={open}
//         >
//           {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//         </button>
//       </div>

//       {open && (
//         <div className="border-t border-navy-800 px-4 pb-4 md:hidden">
//           <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile">
//             {LINKS.map((l) => (
//               <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
//                 {l.label}
//               </NavLink>
//             ))}
//             {profile ? (
//               <Link to={ROLE_HOME[profile.role]} onClick={() => setOpen(false)} className="mt-2 rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white">
//                 Dashboard
//               </Link>
//             ) : (
//               <div className="mt-2 flex gap-2">
//                 <Link to={ROUTES.login} onClick={() => setOpen(false)} className="flex-1 rounded-md border border-navy-700 px-3 py-2 text-center text-sm font-medium text-white">
//                   Login
//                 </Link>
//                 <Link to={ROUTES.register} onClick={() => setOpen(false)} className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white">
//                   Register
//                 </Link>
//               </div>
//             )}
//           </nav>
//         </div>
//       )}
//     </header>
//   )
// }

import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { ROUTES } from '../../app/routes'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME } from '../../lib/navigation'

const LINKS = [
  { label: 'About', to: ROUTES.about },
  { label: 'Services', to: ROUTES.services },
  { label: 'Track parcel', to: ROUTES.track },
  { label: 'Contact', to: ROUTES.contact },
]

export default function Navbar() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-3 py-1.5 text-sm font-medium ${
      isActive ? 'border-lime text-white' : 'border-transparent text-white/70 hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-30 bg-navy-900">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to={ROUTES.home} className="text-lg font-semibold tracking-tight text-white" onClick={() => setOpen(false)}>
          Dispatch<span className="text-lime">Hub</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {profile ? (
            <Link to={ROLE_HOME[profile.role]} className="rounded-md bg-lime px-4 py-1.5 text-sm font-semibold text-navy-900 hover:bg-lime-dark">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to={ROUTES.login} className="text-sm font-medium text-white/70 hover:text-white">
                Login
              </Link>
              <Link to={ROUTES.register} className="rounded-md bg-lime px-4 py-1.5 text-sm font-semibold text-navy-900 hover:bg-lime-dark">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {profile ? (
              <Link to={ROLE_HOME[profile.role]} onClick={() => setOpen(false)} className="mt-3 rounded-md bg-lime px-4 py-2 text-center text-sm font-semibold text-navy-900">
                Dashboard
              </Link>
            ) : (
              <div className="mt-3 flex gap-2">
                <Link to={ROUTES.login} onClick={() => setOpen(false)} className="flex-1 rounded-md border border-white/20 px-4 py-2 text-center text-sm font-medium text-white">
                  Login
                </Link>
                <Link to={ROUTES.register} onClick={() => setOpen(false)} className="flex-1 rounded-md bg-lime px-4 py-2 text-center text-sm font-semibold text-navy-900">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
