// import { Link } from 'react-router-dom'
// import { ROUTES } from '../../app/routes'
// import { COPYRIGHT_TEXT } from '../../lib/constants'
// import { settingText, usePublicSettings } from '../../hooks/usePublicSettings'

// const COMPANY = [
//   { label: 'About Us', to: ROUTES.about },
//   { label: 'Services', to: ROUTES.services },
//   { label: 'Contact Us', to: ROUTES.contact },
// ]
// const SUPPORT = [
//   { label: 'Track Parcel', to: ROUTES.track },
//   { label: 'Privacy Policy', to: ROUTES.privacy },
//   { label: 'Terms of Service', to: ROUTES.terms },
// ]

// export default function Footer() {
//   const { settings } = usePublicSettings()
//   const email = settingText(settings, 'contact.email', 'support@dispatchhub.example')
//   const phone = settingText(settings, 'contact.phone', '+91 00000 00000')
//   const address = settingText(settings, 'contact.address', 'DispatchHub Demo Office, Mumbai, Maharashtra')

//   const linkClass = 'text-sm text-slate-400 hover:text-white'

//   return (
//     <footer className="bg-navy-950 text-slate-300">
//       <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
//         <div>
//           <p className="text-lg font-semibold tracking-tight text-white">
//             Dispatch<span className="text-brand-500">Hub</span>
//           </p>
//           <p className="mt-2 text-sm text-slate-400">
//             Courier management for booking, tracking and delivering parcels across branches.
//           </p>
//         </div>

//         <nav aria-label="Company">
//           <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</p>
//           <ul className="mt-3 space-y-2">
//             {COMPANY.map((l) => (
//               <li key={l.to}>
//                 <Link to={l.to} className={linkClass}>
//                   {l.label}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </nav>

//         <nav aria-label="Support">
//           <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support</p>
//           <ul className="mt-3 space-y-2">
//             {SUPPORT.map((l) => (
//               <li key={l.to}>
//                 <Link to={l.to} className={linkClass}>
//                   {l.label}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </nav>

//         <div>
//           <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
//           <address className="mt-3 space-y-2 text-sm not-italic text-slate-400">
//             <p>{address}</p>
//             <p>
//               <a href={`mailto:${email}`} className="hover:text-white">
//                 {email}
//               </a>
//             </p>
//             <p>{phone}</p>
//           </address>
//         </div>
//       </div>

//       <div className="border-t border-navy-800 py-4 text-center text-sm text-slate-400">{COPYRIGHT_TEXT}</div>
//     </footer>
//   )
// }

import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import { COPYRIGHT_TEXT } from '../../lib/constants'
import { settingText, usePublicSettings } from '../../hooks/usePublicSettings'

const COMPANY = [
  { label: 'About Us', to: ROUTES.about },
  { label: 'Services', to: ROUTES.services },
  { label: 'Contact Us', to: ROUTES.contact },
]
const SUPPORT = [
  { label: 'Track Parcel', to: ROUTES.track },
  { label: 'Privacy Policy', to: ROUTES.privacy },
  { label: 'Terms of Service', to: ROUTES.terms },
]

export default function Footer() {
  const { settings } = usePublicSettings()
  const email = settingText(settings, 'contact.email', 'support@dispatchhub.example')
  const phone = settingText(settings, 'contact.phone', '+91 00000 00000')
  const address = settingText(settings, 'contact.address', 'DispatchHub Demo Office, Mumbai, Maharashtra')

  const linkClass = 'text-sm text-white/60 hover:text-white'
  const headingClass = 'text-xs font-semibold uppercase tracking-wider text-white/40'

  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">
            Dispatch<span className="text-lime">Hub</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Courier management for booking, tracking and delivering parcels across branches.
          </p>
        </div>

        <nav aria-label="Company">
          <p className={headingClass}>Company</p>
          <ul className="mt-4 space-y-2">
            {COMPANY.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support">
          <p className={headingClass}>Support</p>
          <ul className="mt-4 space-y-2">
            {SUPPORT.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={headingClass}>Contact</p>
          <address className="mt-4 space-y-2 text-sm not-italic text-white/60">
            <p>{address}</p>
            <p>
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </p>
            <p>{phone}</p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-sm text-white/50">{COPYRIGHT_TEXT}</div>
    </footer>
  )
}
