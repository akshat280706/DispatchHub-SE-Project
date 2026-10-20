import LegalDocument from '../../components/layout/LegalDocument'
import type { LegalSection } from '../../components/layout/LegalDocument'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Using DispatchHub',
    body: [
      'By creating an account or booking a parcel you agree to these terms. You must give accurate details and keep your login private.',
    ],
  },
  {
    heading: 'Accounts and roles',
    body: [
      'New accounts are always customer accounts. Staff accounts are created or changed only by an administrator.',
    ],
  },
  {
    heading: 'Bookings and pricing',
    body: [
      'The shipping charge is calculated from the zone, parcel category and weight using the rate rules active at the time of booking, plus GST. The total shown on the confirmation page is the amount recorded for the parcel.',
      'Parcels above the maximum weight shown on the Services page cannot be booked.',
    ],
  },
  {
    heading: 'Payments',
    body: [
      'A booking is confirmed when payment is recorded, or immediately for cash on pickup. In development mode, payments are simulated and no real money is processed. Screens that use simulated payments say so.',
    ],
  },
  {
    heading: 'Cancellation',
    body: [
      'You can cancel a parcel yourself while it is booked or confirmed, before pickup is assigned. After that, contact the branch through Contact Us. A cancelled parcel that was paid is marked as refunded in the records.',
    ],
  },
  {
    heading: 'Delivery and estimates',
    body: [
      'Estimated delivery dates are based on the zone and are not guarantees. Delays can happen.',
      'A parcel is marked delivered only after the receiver’s delivery code is verified by the delivery partner. If a delivery attempt fails, another attempt or a return to the sender is arranged.',
    ],
  },
  {
    heading: 'What you may not send',
    body: [
      'Do not send items that are illegal, dangerous, or that you do not have the right to send. DispatchHub may refuse or cancel a booking that breaks this rule.',
    ],
  },
  {
    heading: 'Complaints',
    body: [
      'Raise a complaint from your account against one of your own parcels. Managers and administrators review it and update its status: open, in review, resolved, closed.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'Replace this section with the liability and compensation rules that apply to your actual service before using DispatchHub commercially.',
    ],
  },
  {
    heading: 'Changes',
    body: ['These terms may be updated. The date at the top shows the latest version.'],
  },
]

export default function Terms() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="20 October 2026"
      intro="This text was written for the DispatchHub demonstration project and is meant to be edited. It is not legal advice, and it should be reviewed before DispatchHub is used with real customers."
      sections={SECTIONS}
    />
  )
}