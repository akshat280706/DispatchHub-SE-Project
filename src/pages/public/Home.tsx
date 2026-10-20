import { Link } from 'react-router-dom'
import { FileText, PackageCheck, Smartphone, Truck, Wrench } from 'lucide-react'
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
  const bookTo = profile ? ROLE_HOME[profile.role] : ROUTES.register

  return (
    <>
      <section className="bg-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-medium text-brand-500">{APP_TAGLINE}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Send a parcel. Follow it from the counter to the doorstep.
            </h1>
            <p className="mt-4 max-w-lg text-slate-300">
              DispatchHub connects customers, branches and delivery partners in one system, so every parcel has an owner,
              a status and a history.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={bookTo} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Book a parcel
              </Link>
              <Link to={ROUTES.services} className="rounded-md border border-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                View services
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 text-slate-800">
            <h2 className="text-lg font-semibold">Track a parcel</h2>
            <p className="mt-1 mb-4 text-sm text-slate-600">Enter the tracking number from your booking confirmation.</p>
            <TrackForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="mt-1 text-slate-600">Four parcel categories, each with its own rate.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <s.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <Link to={ROUTES.services} className="mt-5 inline-block text-sm font-medium text-brand-700 hover:underline">
          See pricing zones and limits
        </Link>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="border-l-2 border-brand-500 pl-4">
              <dt className="font-semibold text-slate-900">{b.title}</dt>
              <dd className="mt-1 text-sm text-slate-600">{b.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-brand-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Truck className="mt-1 h-6 w-6 text-brand-700" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">Ready to send something?</h2>
              <p className="text-sm text-slate-600">Create an account, get a quote and book in a few minutes.</p>
            </div>
          </div>
          <Link to={bookTo} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
            {profile ? 'Go to dashboard' : 'Book a parcel'}
          </Link>
        </div>
      </section>
    </>
  )
}