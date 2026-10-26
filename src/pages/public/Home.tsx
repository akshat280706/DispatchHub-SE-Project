// import { useState } from 'react'
// import type { FormEvent } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import {
//   ArrowRight,
//   Calendar,
//   ChevronRight,
//   CreditCard,
//   Headphones,
//   MapPin,
//   Package,
//   PackageCheck,
//   Search,
//   Shield,
//   ShieldCheck,
//   Truck,
//   Zap,
// } from 'lucide-react'
// import { ROUTES, trackRoute } from '../../app/routes'
// import { useAuth } from '../../hooks/useAuth'
// import { ROLE_HOME } from '../../lib/navigation'
// import { isValidTrackingNumber, normalizeTrackingNumber } from '../../services/trackingService'

// const SERVICES = [
//   {
//     icon: Package,
//     title: 'Parcel Booking',
//     text: 'Book your parcel in minutes with easy and secure process.',
//     link: ROUTES.register,
//   },
//   {
//     icon: Search,
//     title: 'Shipment Tracking',
//     text: 'Track your parcel in real-time with updates at every step.',
//     link: ROUTES.track,
//   },
//   {
//     icon: Truck,
//     title: 'Delivery Management',
//     text: 'Efficient delivery with trusted personnel.',
//     link: ROUTES.services,
//   },
//   {
//     icon: ShieldCheck,
//     title: 'Secure Delivery',
//     text: 'OTP verification, signature and photo proof.',
//     link: ROUTES.about,
//   },
// ]

// const STEPS = [
//   {
//     number: '1',
//     icon: Calendar,
//     title: 'Book Your Parcel',
//     text: 'Enter details and get a quote.',
//   },
//   {
//     number: '2',
//     icon: CreditCard,
//     title: 'Make Payment',
//     text: 'Choose your preferred method.',
//   },
//   {
//     number: '3',
//     icon: Truck,
//     title: 'Track & Receive',
//     text: 'Get real-time updates.',
//   },
//   {
//     number: '4',
//     icon: PackageCheck,
//     title: 'Delivery Done',
//     text: 'Safe and on time.',
//   },
// ]

// const WHY_CHOOSE = [
//   {
//     icon: Zap,
//     title: 'Fast Delivery',
//     text: 'Timely and efficient service.',
//   },
//   {
//     icon: Shield,
//     title: 'Safe & Secure',
//     text: 'Your parcels are always protected.',
//   },
//   {
//     icon: MapPin,
//     title: 'Real-Time Tracking',
//     text: 'Stay updated at every step.',
//   },
//   {
//     icon: Headphones,
//     title: '24/7 Support',
//     text: "We're always here to help.",
//   },
// ]

// export default function Home() {
//   const { profile } = useAuth()
//   const navigate = useNavigate()
//   const [trackingNumber, setTrackingNumber] = useState('')
//   const [trackError, setTrackError] = useState<string | null>(null)

//   const bookTo = profile
//     ? profile.role === 'CUSTOMER'
//       ? '/app/customer/book'
//       : ROLE_HOME[profile.role]
//     : ROUTES.register

//   function handleTrack(e: FormEvent) {
//     e.preventDefault()
//     const normalized = normalizeTrackingNumber(trackingNumber)
//     if (!isValidTrackingNumber(normalized)) {
//       setTrackError('Enter a valid tracking number.')
//       return
//     }
//     setTrackError(null)
//     navigate(trackRoute(normalized))
//   }

//   return (
//     <div className="bg-white">
//       {/* Hero Section */}
//       <section className="relative overflow-hidden bg-navy-950 text-white min-h-[480px] lg:min-h-[520px] flex items-center">
//         {/* Adjusted Background Image with Van and Delivery Person */}
//         <div
//           className="absolute inset-0 bg-no-repeat bg-cover bg-[center_right] md:bg-right"
//           style={{ backgroundImage: `url('/hero-bg.jpg')` }}
//           aria-hidden="true"
//         />

//         {/* Dark Vignette Overlay for Crisp Legibility */}
//         <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/95 via-45% md:via-50% to-transparent" />
//         <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent lg:hidden" />

//         <div className="relative mx-auto w-full max-w-6xl px-4 py-12 lg:py-16">
//           <div className="max-w-xl">
//             <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
//               Fast. Safe. Reliable.
//               <span className="block mt-1">Courier Services for</span>
//               <span className="block text-blue-500">Your Every Need.</span>
//             </h1>

//             <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-lg">
//               DispatchHub makes parcel delivery simple, secure and trackable. From booking to delivery,
//               we&apos;re with you every step of the way.
//             </p>

//             {/* Track Your Parcel Card */}
//             <div className="mt-7 rounded-xl bg-white p-5 shadow-xl max-w-md text-slate-800">
//               <h2 className="text-sm font-bold text-slate-900 mb-2.5">Track Your Parcel</h2>
//               <form onSubmit={handleTrack} className="flex gap-2" noValidate>
//                 <div className="flex-1">
//                   <input
//                     type="text"
//                     value={trackingNumber}
//                     onChange={(e) => setTrackingNumber(e.target.value)}
//                     placeholder="Enter tracking number..."
//                     autoComplete="off"
//                     aria-label="Tracking number"
//                     className={`w-full rounded-md border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                       trackError ? 'border-red-500' : 'border-slate-300'
//                     }`}
//                   />
//                   {trackError && <p className="mt-1 text-xs text-red-600">{trackError}</p>}
//                 </div>
//                 <button
//                   type="submit"
//                   className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm h-fit shrink-0 cursor-pointer"
//                 >
//                   Track
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Our Services Section */}
//       <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
//         <div className="text-left">
//           <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Our Services</h2>
//           <div className="w-10 h-1 bg-blue-600 rounded-full mt-2" />
//         </div>

//         <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//           {SERVICES.map((s) => (
//             <div
//               key={s.title}
//               className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
//             >
//               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5 border border-blue-100">
//                 <s.icon className="h-6 w-6" aria-hidden="true" />
//               </div>
//               <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
//               <p className="mt-2 text-xs leading-relaxed text-slate-600">{s.text}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section className="border-t border-slate-100 bg-slate-50/50 py-14 sm:py-16">
//         <div className="mx-auto max-w-6xl px-4">
//           <div className="text-left">
//             <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How It Works</h2>
//             <div className="w-10 h-1 bg-blue-600 rounded-full mt-2" />
//           </div>

//           <div className="mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
//             {STEPS.map((step, idx) => (
//               <div key={step.number} className="flex flex-1 items-center gap-4">
//                 <div className="flex items-center gap-3">
//                   <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shrink-0 shadow-xs">
//                     {step.number}
//                   </span>
//                   <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
//                     <step.icon className="h-5 w-5" aria-hidden="true" />
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
//                     <p className="text-xs text-slate-500">{step.text}</p>
//                   </div>
//                 </div>

//                 {idx < STEPS.length - 1 && (
//                   <ChevronRight className="hidden lg:block h-5 w-5 text-slate-300 ml-auto shrink-0" aria-hidden="true" />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Why Choose DispatchHub Section */}
//       <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
//         <div className="text-left">
//           <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why Choose DispatchHub?</h2>
//           <div className="w-10 h-1 bg-blue-600 rounded-full mt-2" />
//         </div>

//         <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//           {WHY_CHOOSE.map((item) => (
//             <div key={item.title} className="flex items-start gap-3.5">
//               <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
//                 <item.icon className="h-5 w-5" aria-hidden="true" />
//               </div>
//               <div>
//                 <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
//                 <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.text}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Royal Blue Call to Action Banner */}
//       <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-16">
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 sm:p-8 text-white shadow-md">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
//             <div className="flex items-center gap-4">
//               <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shrink-0">
//                 <PackageCheck className="h-8 w-8" aria-hidden="true" />
//               </div>
//               <div>
//                 <h2 className="text-xl sm:text-2xl font-bold text-white">Ready to send your parcel?</h2>
//                 <p className="mt-1 text-sm text-blue-100">Book now and experience hassle-free delivery.</p>
//               </div>
//             </div>

//             <Link
//               to={bookTo}
//               className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-600 shadow-sm hover:bg-blue-50 transition shrink-0"
//             >
//               <span>Book a Parcel</span>
//               <ArrowRight className="h-4 w-4" aria-hidden="true" />
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }


import { Link } from 'react-router-dom'
import { FileText, PackageCheck, Smartphone, Wrench } from 'lucide-react'
import { ROUTES } from '../../app/routes'
import { APP_TAGLINE } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME } from '../../lib/navigation'
import TrackForm from '../../components/domain/TrackForm'

const SERVICES = [
  { icon: FileText, title: 'Documents', text: 'Letters, certificates and paperwork, priced from the lowest rate band.' },
  { icon: PackageCheck, title: 'General parcels', text: 'Everyday packages up to the weight limit, quoted before you pay.' },
  { icon: Wrench, title: 'Fragile items', text: 'A handling surcharge applies so these parcels are flagged for careful handling.' },
  { icon: Smartphone, title: 'Electronics', text: 'Phones, laptops and accessories, booked with a description of the contents.' },
]

const STEPS = [
  { title: 'Book', text: 'Enter sender, receiver and parcel details. You see the full cost breakdown first.' },
  { title: 'Pay', text: 'Choose a payment method. Your booking is confirmed once payment is recorded.' },
  { title: 'Pickup', text: 'The origin branch assigns a delivery partner to collect your parcel.' },
  { title: 'In transit', text: 'Every step between branches is added to your tracking history.' },
  { title: 'Delivered', text: 'The receiver gives a delivery code, and the parcel is marked delivered.' },
]

const BENEFITS = [
  { title: 'A price before you commit', text: 'Charges follow published rate rules: base charge, extra weight, handling and GST.' },
  { title: 'A history you can read', text: 'Each status change is stored as its own event, so the timeline never gets overwritten.' },
  { title: 'Delivery that needs a code', text: 'A parcel can only be marked delivered after the receiver’s code is verified.' },
  { title: 'Access by role', text: 'Customers, delivery partners, branch managers and admins each see only what their job needs.' },
]

export default function Home() {
  const { profile } = useAuth()
  const bookTo = profile
    ? profile.role === 'CUSTOMER'
      ? '/app/customer/book'
      : ROLE_HOME[profile.role]
    : ROUTES.register

  return (
    <>
      <section className="bg-navy-900">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-medium text-lime">{APP_TAGLINE}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Send a parcel. Follow it from the counter to the <span className="text-lime">doorstep</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/70">
              DispatchHub connects customers, branches and delivery partners in one system, so every parcel has an owner, a
              status and a history.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={bookTo} className="rounded-md bg-lime px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-lime-dark">
                Book a parcel
              </Link>
              <Link to={ROUTES.services} className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10">
                View services
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold">Track a parcel</h2>
            <p className="mb-4 mt-1 text-sm text-slate-600">Enter the tracking number from your booking confirmation.</p>
            <TrackForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="mt-1 text-slate-600">Parcel categories, each with its own rate.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-900">
                <s.icon className="h-5 w-5 text-lime" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <Link to={ROUTES.services} className="mt-6 inline-block text-sm font-medium text-brand-700">
          See pricing zones and limits
        </Link>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-900 text-sm font-semibold text-lime">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="border-l-2 border-lime pl-4">
              <dt className="font-semibold text-navy-900">{b.title}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">{b.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">Ready to send something?</h2>
            <p className="mt-1 text-white/70">Create an account, get a quote and book in a few minutes.</p>
          </div>
          <Link to={bookTo} className="rounded-md bg-lime px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-lime-dark">
            {profile ? 'Go to dashboard' : 'Book a parcel'}
          </Link>
        </div>
      </section>
    </>
  )
}

