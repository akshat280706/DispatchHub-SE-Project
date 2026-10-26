// import { useEffect, useState } from 'react'
// import { NavLink, Link, Outlet } from 'react-router-dom'
// import { LogOut, Menu, X } from 'lucide-react'
// import { useAuth } from '../../hooks/useAuth'
// import { ROLE_HOME, ROLE_LABEL, ROLE_NAV } from '../../lib/navigation'
// import { COPYRIGHT_TEXT } from '../../lib/constants'
// import { getErrorMessage } from '../../lib/errors'
// import Button from '../ui/Button'
// import NotificationBell from '../domain/NotificationBell'

// export default function DashboardLayout() {
//   const { profile, signOut } = useAuth()
//   const [open, setOpen] = useState(false)
//   const [signOutError, setSignOutError] = useState<string | null>(null)

//   useEffect(() => {
//     document.title = 'DispatchHub | Dashboard'
//   }, [])

//   if (!profile) return null // ProtectedRoute guarantees a profile before this renders

//   const items = ROLE_NAV[profile.role]

//   async function handleSignOut() {
//     setSignOutError(null)
//     try {
//       await signOut()
//     } catch (e) {
//       setSignOutError(getErrorMessage(e))
//     }
//   }

//   return (
//     <div className="min-h-screen lg:flex">
//       {open && (
//         <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col bg-navy-900 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
//           open ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         <div className="flex h-16 items-center justify-between px-5">
//           <Link to={ROLE_HOME[profile.role]} className="text-lg font-semibold tracking-tight text-white">
//             Dispatch<span className="text-brand-500">Hub</span>
//           </Link>
//           <button className="rounded p-1 text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main">
//           {items.map((item) =>
//             item.ready ? (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 end
//                 onClick={() => setOpen(false)}
//                 className={({ isActive }) =>
//                   `block rounded-md px-3 py-2 text-sm font-medium ${
//                     isActive ? 'bg-navy-700 text-white' : 'hover:bg-navy-800 hover:text-white'
//                   }`
//                 }
//               >
//                 {item.label}
//               </NavLink>
//             ) : (
//               <span
//                 key={item.to}
//                 aria-disabled="true"
//                 title="Coming in a later batch"
//                 className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-slate-500"
//               >
//                 {item.label}
//                 <span className="rounded bg-navy-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
//               </span>
//             ),
//           )}
//         </nav>
//       </aside>

//       <div className="flex min-h-screen min-w-0 flex-1 flex-col">
//         <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
//           <button className="rounded p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
//             <Menu className="h-5 w-5" />
//           </button>
//           <div className="ml-auto flex items-center gap-3">
//             <NotificationBell />
//             <Link to="/app/account" className="rounded-md px-2 py-1 text-right leading-tight hover:bg-slate-100" title="Account settings">
//               <p className="text-sm font-medium text-slate-900">{profile.full_name}</p>
//               <p className="text-xs text-slate-500">{ROLE_LABEL[profile.role]}</p>
//             </Link>
//             <Button variant="secondary" onClick={handleSignOut}>
//               <LogOut className="h-4 w-4" aria-hidden="true" />
//               <span className="hidden sm:inline">Sign out</span>
//             </Button>
//           </div>
//         </header>

//         {signOutError && (
//           <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700">
//             {signOutError}
//           </p>
//         )}

//         <main className="flex-1 px-4 py-6 sm:px-6">
//           <Outlet />
//         </main>

//         <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
//           {COPYRIGHT_TEXT}
//         </footer>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME, ROLE_LABEL, ROLE_NAV } from '../../lib/navigation'
import { COPYRIGHT_TEXT } from '../../lib/constants'
import { getErrorMessage } from '../../lib/errors'
import Button from '../ui/Button'
import NotificationBell from '../domain/NotificationBell'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'DispatchHub | Dashboard'
  }, [])

  if (!profile) return null // ProtectedRoute guarantees a profile before this renders

  const items = ROLE_NAV[profile.role]

  async function handleSignOut() {
    setSignOutError(null)
    try {
      await signOut()
    } catch (e) {
      setSignOutError(getErrorMessage(e))
    }
  }

  return (
    <div className="min-h-screen lg:flex">
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col bg-navy-900 text-white/70 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to={ROLE_HOME[profile.role]} className="text-lg font-semibold tracking-tight text-white">
            Dispatch<span className="text-lime">Hub</span>
          </Link>
          <button className="rounded p-1 text-white/60 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-5 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          {ROLE_LABEL[profile.role]}
        </p>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main">
          {items.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-r-md border-l-2 px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'border-lime bg-white/10 text-white'
                      : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <span
                key={item.to}
                aria-disabled="true"
                title="Coming in a later batch"
                className="flex cursor-not-allowed items-center justify-between border-l-2 border-transparent px-3 py-2 text-sm text-white/35"
              >
                {item.label}
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <button className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Link to="/app/account" className="rounded-md px-2 py-1 text-right leading-tight hover:bg-slate-100" title="Account settings">
              <p className="text-sm font-medium text-slate-900">{profile.full_name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[profile.role]}</p>
            </Link>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {signOutError && (
          <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700">
            {signOutError}
          </p>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
          {COPYRIGHT_TEXT}
        </footer>
      </div>
    </div>
  )
}

