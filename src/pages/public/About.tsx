import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import { ROUTES } from '../../app/routes'

const ROLES = [
  { title: 'Customers', text: 'Book parcels, pay, follow each shipment, raise complaints and read notifications.' },
  { title: 'Delivery personnel', text: 'See their assigned pickups and deliveries, update progress and complete deliveries with a code and a photo.' },
  { title: 'Branch managers', text: 'Run the parcels moving through their branch, assign delivery partners and handle complaints.' },
  { title: 'Administrators', text: 'Manage users, branches, shipping rates, settings and system-wide reports.' },
]

export default function About() {
  return (
    <>
      <PageHeader
        title="About DispatchHub"
        subtitle="A courier management system that keeps booking, payment, assignment and delivery in one place."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-3xl space-y-4 text-slate-700">
          <p>
            Courier work involves many hands: the customer who books, the branch that sorts, the partner who collects and the
            partner who delivers. When each step lives in a different notebook or chat, parcels get lost between them.
          </p>
          <p>
            DispatchHub records each step in a single database. A parcel has one current status and a separate, permanent
            history of everything that happened to it. Managers can see what is waiting for assignment, and customers can
            see where their parcel stands without calling anyone.
          </p>
          <p className="rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm">
            This system was built as a Software Engineering course project. It uses fictional branches and demonstration data.
            Payments run in a clearly labelled development mode and no real money is processed.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-semibold">Who uses it</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{r.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm font-medium">
          <Link to={ROUTES.services} className="text-brand-700 hover:underline">
            Our services
          </Link>
          <Link to={ROUTES.contact} className="text-brand-700 hover:underline">
            Contact us
          </Link>
        </div>
      </div>
    </>
  )
}
