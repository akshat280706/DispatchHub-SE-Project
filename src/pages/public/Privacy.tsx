import LegalDocument from '../../components/layout/LegalDocument'
import type { LegalSection } from '../../components/layout/LegalDocument'

const SECTIONS: LegalSection[] = [
  {
    heading: 'What this policy covers',
    body: [
      'This policy explains what information DispatchHub stores when you use the website and how that information is used inside the system.',
    ],
  },
  {
    heading: 'Information we store',
    body: [
      'Account details: your name, email address, optional phone number and role. Your password is handled by the authentication service and is not readable by DispatchHub staff.',
      'Parcel details: sender and receiver names, phone numbers, pickup and delivery addresses, parcel weight, category and description, the charges calculated, and the tracking history.',
      'Payment records: the amount, method, status and a transaction reference. Card numbers, CVVs and payment passwords are never stored.',
      'Delivery records: a delivery photo uploaded by the delivery partner and the time a delivery was verified.',
      'Messages and complaints: anything you send through the contact form or a complaint.',
    ],
  },
  {
    heading: 'How the information is used',
    body: [
      'It is used to book, assign, track and deliver parcels, to show you notifications about your shipments, to handle complaints and to produce operational reports.',
    ],
  },
  {
    heading: 'Who can see it',
    body: [
      'Access depends on role. Customers see their own parcels. Delivery partners see parcels assigned to them. Branch managers see parcels that start or end at their branch. Administrators can see system-wide records.',
      'Public tracking by tracking number shows only the status, branch cities, dates and tracking events. It never shows names, phone numbers, street addresses, payment details or delivery photos.',
    ],
  },
  {
    heading: 'Storage and protection',
    body: [
      'Data is stored in a managed database with access rules enforced by the database itself. Delivery photos are kept in a private storage area and opened only through short-lived links for authorised users.',
      'No system is perfectly secure, and we cannot promise absolute protection.',
    ],
  },
  {
    heading: 'Retention',
    body: [
      'Parcel, payment and tracking records are kept as part of the delivery history and are not deleted when a parcel is cancelled or completed. Accounts are deactivated rather than erased so that past records stay consistent.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'You can update your profile details after signing in. To ask about or correct other information, use the Contact Us page.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: ['This page shows the date it was last updated. Changes take effect when they are published here.'],
  },
]

export default function Privacy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="20 October 2026"
      intro="This text was written for the DispatchHub demonstration project and is meant to be edited. It is not legal advice, and it should be reviewed before DispatchHub is used with real customers."
      sections={SECTIONS}
    />
  )
}