import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import { ROUTES } from '../../app/routes'
import { settingNumber, usePublicSettings } from '../../hooks/usePublicSettings'

const CATEGORIES = [
  { name: 'Document', text: 'Paperwork and flat envelopes.' },
  { name: 'General', text: 'Everyday parcels with no special handling.' },
  { name: 'Fragile', text: 'Breakable items. Carries a handling surcharge.' },
  { name: 'Electronics', text: 'Devices and accessories. Carries a handling surcharge.' },
  { name: 'Clothing', text: 'Garments and textiles.' },
  { name: 'Other', text: 'Anything that does not fit above, with a small surcharge.' },
]

export default function Services() {
  const { settings } = usePublicSettings()
  const maxWeight = settingNumber(settings, 'booking.max_weight_kg', 50)
  const gst = settingNumber(settings, 'tax.gst_percent', 18)

  const zones = [
    { zone: 'Local', rule: 'Origin and destination branches are in the same city', days: settingNumber(settings, 'delivery.estimate_days.LOCAL', 2) },
    { zone: 'Regional', rule: 'Different cities in the same state', days: settingNumber(settings, 'delivery.estimate_days.REGIONAL', 4) },
    { zone: 'National', rule: 'Branches in different states', days: settingNumber(settings, 'delivery.estimate_days.NATIONAL', 7) },
  ]

  return (
    <>
      <PageHeader title="Services" subtitle="Branch-to-branch parcel delivery with a quote before you book." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-semibold">Parcel categories</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{c.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-semibold">How pricing works</h2>
        <p className="mt-2 max-w-3xl text-slate-700">
          The rate depends on the zone and the category. A base charge covers the first kilogram. Extra weight is charged per
          0.5 kg step, a handling surcharge is added where it applies, and GST of {gst}% is added to the shipping charge.
          Zones come from the cities and states of the branches you choose; DispatchHub does not measure road distance.
        </p>

        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Zone</th>
                <th scope="col" className="px-4 py-3">When it applies</th>
                <th scope="col" className="px-4 py-3">Estimated delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {zones.map((z) => (
                <tr key={z.zone}>
                  <td className="px-4 py-3 font-medium">{z.zone}</td>
                  <td className="px-4 py-3 text-slate-600">{z.rule}</td>
                  <td className="px-4 py-3 text-slate-600">about {z.days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-6 max-w-3xl list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Maximum parcel weight: {maxWeight} kg.</li>
          <li>Delivery dates are estimates, not guarantees.</li>
          <li>Exact rates are shown as a quote when you sign in and start a booking.</li>
        </ul>

        <div className="mt-8">
          <Link to={ROUTES.register} className="inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Create an account
          </Link>
        </div>
      </div>
    </>
  )
}
