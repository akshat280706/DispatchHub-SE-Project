import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  MapPin,
  Package,
  PackageCheck,
  Scale,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Wrench,
  Boxes,
  Building2,
  XCircle,
} from 'lucide-react'
import { ROUTES } from '../../app/routes'
import { APP_TAGLINE } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME } from '../../lib/navigation'
import { formatINR } from '../../lib/format'
import TrackForm from '../../components/domain/TrackForm'
import { settingNumber, usePublicSettings } from '../../hooks/usePublicSettings'

type RateZone = 'LOCAL' | 'REGIONAL' | 'NATIONAL'
type CategoryKey = 'DOCUMENT' | 'GENERAL' | 'FRAGILE' | 'ELECTRONICS' | 'CLOTHING' | 'OTHER'

interface ZoneRateConfig {
  name: string
  label: string
  desc: string
  baseCharge: number
  perKgCharge: number
  defaultDays: number
}

const ZONE_CONFIG: Record<RateZone, ZoneRateConfig> = {
  LOCAL: {
    name: 'Local',
    label: 'Same City',
    desc: 'Origin and destination branches are in the same city',
    baseCharge: 40,
    perKgCharge: 15,
    defaultDays: 2,
  },
  REGIONAL: {
    name: 'Regional',
    label: 'Same State',
    desc: 'Different cities within the same state',
    baseCharge: 70,
    perKgCharge: 25,
    defaultDays: 4,
  },
  NATIONAL: {
    name: 'National',
    label: 'Inter-State',
    desc: 'Origin and destination in different states',
    baseCharge: 110,
    perKgCharge: 40,
    defaultDays: 7,
  },
}

const CATEGORY_CONFIG: Record<CategoryKey, { label: string; surcharge: number; careTag: string }> = {
  DOCUMENT: { label: 'Document', surcharge: 0, careTag: 'Base Band' },
  GENERAL: { label: 'General Parcel', surcharge: 0, careTag: 'Standard' },
  FRAGILE: { label: 'Fragile Goods', surcharge: 30, careTag: '+₹30 Care Flag' },
  ELECTRONICS: { label: 'Electronics', surcharge: 40, careTag: '+₹40 Inspected' },
  CLOTHING: { label: 'Clothing & Textiles', surcharge: 0, careTag: 'Standard' },
  OTHER: { label: 'Custom / Other', surcharge: 10, careTag: '+₹10 Handling' },
}

const SERVICES = [
  {
    icon: FileText,
    title: 'Document',
    tag: 'Base rate band',
    text: 'Envelopes, paperwork, contracts and certificates. Processed with expedited sorting and counter clearance.',
    recommendation: 'Use waterproof cardboard document sleeves.',
  },
  {
    icon: PackageCheck,
    title: 'General parcel',
    tag: 'Standard rate',
    text: 'Everyday packages up to maximum weight limits, quoted upfront with no surprise counter surcharges.',
    recommendation: 'Secure with standard carton tape and rigid outer box.',
  },
  {
    icon: Wrench,
    title: 'Fragile goods',
    tag: 'Care surcharge',
    text: 'Delicate glassware, ceramics and art. Specially flagged for cushioned handling throughout sorting hubs.',
    recommendation: 'Minimum 2-inch bubble wrap cushion required.',
  },
  {
    icon: Smartphone,
    title: 'Electronics',
    tag: 'Care surcharge',
    text: 'Mobile devices, laptops and accessories, booked with contents verification and itemized notes.',
    recommendation: 'Pack with internal shock absorption and seal tightly.',
  },
  {
    icon: Shirt,
    title: 'Clothing & Textiles',
    tag: 'Standard rate',
    text: 'Garments, apparel and fabrics packed in weather-resistant protective poly mailers or shipping cartons.',
    recommendation: 'Moisture-sealed poly packaging recommended.',
  },
  {
    icon: Boxes,
    title: 'Custom & Other',
    tag: 'Zone rated',
    text: 'Uncommon dimensions or custom packages priced precisely according to published zone and weight rules.',
    recommendation: 'Ensure external dimensions and weight are accurate.',
  },
]

const STEPS = [
  {
    number: '01',
    icon: FileSpreadsheet,
    title: 'Book & Quote',
    short: 'Instant Calculation',
    badge: 'BOOKED',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    actor: 'Customer Portal',
    text: 'Specify sender, recipient, and package dimensions. DispatchHub computes the exact rate, handling fees, and GST before any commitment.',
    detail: 'Full itemized cost transparency with base weight, additional 0.5 kg increments, and estimated delivery dates generated in real time.',
  },
  {
    number: '02',
    icon: CreditCard,
    title: 'Payment Confirmation',
    short: 'Secure Handshake',
    badge: 'CONFIRMED',
    badgeColor: 'bg-brand-50 text-brand-700 border-brand-200',
    actor: 'Checkout Engine',
    text: 'Complete your booking using the development simulated payment or select cash on pickup. An immutable tracking number is immediately issued.',
    detail: 'Your tracking number (e.g. DH261021AB34EF) is permanently registered on the ledger alongside an initial booking milestone.',
  },
  {
    number: '03',
    icon: PackageCheck,
    title: 'Branch Pickup & Intake',
    short: 'Courier Handoff',
    badge: 'PICKED_UP',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    actor: 'Origin Branch & Driver',
    text: 'The origin branch assigns an active delivery personnel to collect the parcel. The package is weighed and scanned into the sorting manifest.',
    detail: 'Weight verification ensures the parcel matches quoted specifications before routing into the regional transport pipeline.',
  },
  {
    number: '04',
    icon: Truck,
    title: 'Inter-Branch Transit',
    short: 'Hub Movement',
    badge: 'IN_TRANSIT',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    actor: 'Hub Logistics',
    text: 'Parcels move securely between branch hubs. Every checkpoint scan appends a permanent, tamper-resistant event to the tracking timeline.',
    detail: 'Live status reflects branch transitions (At Destination Branch, Out for Delivery) with database-recorded timestamps.',
  },
  {
    number: '05',
    icon: ShieldCheck,
    title: 'OTP Verified Delivery',
    short: 'Zero Dispute Handover',
    badge: 'DELIVERED',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    actor: 'Recipient & Field Driver',
    text: 'Upon arrival, the recipient provides their private 6-digit delivery verification code. The parcel is successfully finalized in the system.',
    detail: 'Prevents false drop-off claims and unattended parcel loss. Proof of delivery is confirmed with recipient verification.',
  },
]

const CORE_ADVANTAGES = [
  {
    icon: CheckCircle2,
    title: 'Transparent Zone Pricing',
    text: 'Rates are computed from published formulas: base weight, 0.5 kg increments, handling rules, and statutory GST. Zero counter surprises.',
  },
  {
    icon: Clock,
    title: 'Immutable Milestone History',
    text: 'Every status scan is appended with a permanent database timestamp. The event timeline cannot be overwritten or wiped.',
  },
  {
    icon: ShieldCheck,
    title: 'Code-Verified Deliveries',
    text: 'Parcels cannot be marked delivered without recipient verification, eliminating false deliveries and dispute delays.',
  },
  {
    icon: Users,
    title: 'Role-Separated Workspaces',
    text: 'Dedicated portals for customers, delivery personnel, branch managers, and admins ensure everyone sees only what they need.',
  },
  {
    icon: Building2,
    title: 'Branch Manifest Routing',
    text: 'Origin and destination sorting centers coordinate dispatch queues, personnel assignment, and inter-branch transfers in real time.',
  },
  {
    icon: Package,
    title: 'Complete Lifecycle Tracking',
    text: 'Follow parcels across all 8 standard lifecycle stages, from initial booking and pickup to transit and final doorstep handover.',
  },
]

const ROLES = [
  {
    role: 'Customers',
    badge: 'Self-Service',
    description: 'Book parcels with upfront pricing, monitor shipments on a live timeline, file inquiries, and manage receipts.',
  },
  {
    role: 'Delivery Partners',
    badge: 'Field Ops',
    description: 'Access assigned pickup and delivery runsheets, update stage progress, and verify OTP codes at the door.',
  },
  {
    role: 'Branch Managers',
    badge: 'Hub Logistics',
    description: 'Oversee local parcel manifests, dispatch couriers, coordinate route transfers, and resolve local complaints.',
  },
  {
    role: 'System Admins',
    badge: 'Platform Control',
    description: 'Configure shipping rates, manage branch branches, inspect immutable audit logs, and analyze system health.',
  },
]

const COMPARISON = [
  {
    aspect: 'Pricing Transparency',
    traditional: 'Hidden counter surcharges, variable rates, and unitemized bills.',
    dispatchHub: 'Published formulas, upfront GST, and instant cost breakdown before payment.',
  },
  {
    aspect: 'Tracking Accuracy',
    traditional: 'Delayed batch updates, occasional lost records, and vague status codes.',
    dispatchHub: 'Immutable event ledger with server timestamps recorded at each branch hop.',
  },
  {
    aspect: 'Delivery Verification',
    traditional: 'Packages left unverified or signed with illegible scrawls.',
    dispatchHub: 'Mandatory 6-digit receiver verification code (OTP) required for delivery completion.',
  },
  {
    aspect: 'Dispute Handling',
    traditional: 'Endless call queues and disjointed ticketing spreadsheets.',
    dispatchHub: 'Self-service complaints tied directly to the parcel audit history.',
  },
]

const FAQS = [
  {
    q: 'How are shipping rates calculated on DispatchHub?',
    a: 'Rates depend on the shipping zone (Local, Regional, or National) determined by origin and destination branch cities. A base charge covers the initial 1 kg, extra weight is billed in 0.5 kg increments, handling surcharges apply to fragile or electronic goods, and GST is calculated upfront.',
  },
  {
    q: 'How does the recipient delivery code (OTP) work?',
    a: 'When a parcel is out for delivery, a private 6-digit verification code is generated for the receiver. The delivery partner must enter this code upon arrival before the parcel can be marked as delivered in the system.',
  },
  {
    q: 'Can anyone track a parcel without creating an account?',
    a: 'Yes. Anyone with a valid DispatchHub tracking number (starting with DH) can track a shipment on our public tracking page. For privacy, public tracking displays only branch cities, status milestones, and delivery estimates.',
  },
  {
    q: 'Can a booking be cancelled after it is placed?',
    a: 'Yes, customers can cancel a parcel booking from their dashboard as long as the parcel has not yet been picked up by the courier partner. Once cancelled, the parcel status updates immediately.',
  },
  {
    q: 'What is the maximum allowed parcel weight?',
    a: 'Standard individual parcel bookings support packages up to 50 kg. For heavy or non-standard industrial shipments, contact our logistics support team.',
  },
]

export default function Home() {
  const { profile } = useAuth()
  const { settings } = usePublicSettings()

  // IDs for accessibility
  const zoneSelectId = useId()
  const categorySelectId = useId()
  const weightInputId = useId()

  // Hero Card State: 'track' or 'calculate'
  const [heroTab, setHeroTab] = useState<'track' | 'calculate'>('track')

  // Interactive Calculator State
  const [calcZone, setCalcZone] = useState<RateZone>('LOCAL')
  const [calcCategory, setCalcCategory] = useState<CategoryKey>('GENERAL')
  const [calcWeight, setCalcWeight] = useState<number>(1.5)

  // Interactive How-it-Works Stepper
  const [activeStep, setActiveStep] = useState<number>(0)

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // System settings
  const maxWeight = settingNumber(settings, 'booking.max_weight_kg', 50)
  const gstPercent = settingNumber(settings, 'tax.gst_percent', 18)

  // Calculate live estimate
  const currentZone = ZONE_CONFIG[calcZone]
  const currentCat = CATEGORY_CONFIG[calcCategory]
  const sanitizedWeight = Math.min(Math.max(0.1, Number(calcWeight) || 0.1), maxWeight)
  const extraWeight = Math.ceil(Math.max(0, sanitizedWeight - 1.0) * 2) / 2
  const extraCharge = extraWeight * currentZone.perKgCharge
  const shippingCharge = currentZone.baseCharge + extraCharge + currentCat.surcharge
  const taxAmount = Math.round((shippingCharge * gstPercent) / 100 * 100) / 100
  const totalAmount = shippingCharge + taxAmount
  const estimatedDays = settingNumber(
    settings,
    `delivery.estimate_days.${calcZone}`,
    currentZone.defaultDays,
  )

  const bookTo = profile
    ? profile.role === 'CUSTOMER'
      ? '/app/customer/book'
      : ROLE_HOME[profile.role]
    : ROUTES.register

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,168,160,0.18),rgba(255,255,255,0))] pointer-events-none" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-12 lg:items-center lg:py-18">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
              <span>{APP_TAGLINE}</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              Send parcels with certainty.{' '}
              <span className="text-brand-400">From counter to doorstep.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
              DispatchHub synchronizes customers, sorting hubs, and delivery personnel in one dependable logistics network.
              Enjoy transparent zone pricing, live milestone scans, and secure OTP verification at handover.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to={bookTo}
                className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors focus-visible:outline-brand-500"
              >
                <span>{profile ? 'Go to dashboard' : 'Book a parcel'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setHeroTab('calculate')}
                className="inline-flex items-center gap-2 rounded-md border border-navy-700 bg-navy-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"
              >
                <Calculator className="h-4 w-4 text-brand-400" aria-hidden="true" />
                <span>Estimate shipping rate</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-navy-800/80 pt-6 text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-xs font-medium">Upfront Quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-xs font-medium">OTP Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-xs font-medium">Permanent History</span>
              </div>
            </div>
          </div>

          {/* Interactive Dual-Mode Card (Track / Estimate) */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200/20 bg-white p-6 shadow-xl text-slate-800">
              {/* Tab Selector */}
              <div className="flex items-center rounded-lg bg-slate-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => setHeroTab('track')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                    heroTab === 'track'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  <Search className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  <span>Track Parcel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab('calculate')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                    heroTab === 'calculate'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  <Calculator className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  <span>Quick Estimate</span>
                </button>
              </div>

              {heroTab === 'track' ? (
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <h2 className="text-base font-semibold text-navy-900">Track your shipment</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live System
                    </span>
                  </div>

                  <p className="mt-1 mb-4 text-xs text-slate-600 leading-relaxed">
                    Enter the tracking number from your booking receipt to view live transit checkpoints.
                  </p>

                  <TrackForm />

                  <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                    <p className="font-medium text-slate-700">Sample tracking format</p>
                    <p className="mt-0.5">Tracking codes follow the format <span className="font-mono font-medium text-slate-800">DH261020...</span></p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <h2 className="text-base font-semibold text-navy-900">Instant Rate Calculator</h2>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      Published Rates
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Estimate shipping costs and estimated transit days using our official tariff table.
                  </p>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label htmlFor={zoneSelectId} className="block font-medium text-slate-700 mb-1">
                        Shipping Zone
                      </label>
                      <select
                        id={zoneSelectId}
                        value={calcZone}
                        onChange={(e) => setCalcZone(e.target.value as RateZone)}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="LOCAL">Local (Same city ~ {ZONE_CONFIG.LOCAL.defaultDays} days)</option>
                        <option value="REGIONAL">Regional (Same state ~ {ZONE_CONFIG.REGIONAL.defaultDays} days)</option>
                        <option value="NATIONAL">National (Inter-state ~ {ZONE_CONFIG.NATIONAL.defaultDays} days)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={categorySelectId} className="block font-medium text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          id={categorySelectId}
                          value={calcCategory}
                          onChange={(e) => setCalcCategory(e.target.value as CategoryKey)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                        >
                          <option value="DOCUMENT">Document</option>
                          <option value="GENERAL">General</option>
                          <option value="FRAGILE">Fragile (+₹30)</option>
                          <option value="ELECTRONICS">Electronics (+₹40)</option>
                          <option value="CLOTHING">Clothing</option>
                          <option value="OTHER">Other (+₹10)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={weightInputId} className="block font-medium text-slate-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          id={weightInputId}
                          type="number"
                          min="0.1"
                          max={maxWeight}
                          step="0.5"
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0.1)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Breakdown Box */}
                    <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-slate-700">
                      <div className="flex items-center justify-between pb-1.5 border-b border-brand-100/80">
                        <span className="text-slate-600">Base rate (1 kg):</span>
                        <span className="font-medium text-slate-900">{formatINR(currentZone.baseCharge)}</span>
                      </div>
                      {extraWeight > 0 && (
                        <div className="flex items-center justify-between py-1 text-slate-600">
                          <span>Extra weight ({extraWeight} kg):</span>
                          <span className="font-medium text-slate-900">+{formatINR(extraCharge)}</span>
                        </div>
                      )}
                      {currentCat.surcharge > 0 && (
                        <div className="flex items-center justify-between py-1 text-slate-600">
                          <span>Care surcharge:</span>
                          <span className="font-medium text-slate-900">+{formatINR(currentCat.surcharge)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-1 text-slate-600">
                        <span>GST ({gstPercent}%):</span>
                        <span className="font-medium text-slate-900">+{formatINR(taxAmount)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between pt-1.5 border-t border-brand-200 font-semibold text-navy-900">
                        <span>Total Estimated:</span>
                        <span className="text-sm text-brand-700">{formatINR(totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Delivery: ~{estimatedDays} business days</span>
                      <Link to={bookTo} className="font-semibold text-brand-700 hover:underline">
                        Book this rate →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Network Highlights Strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pt-3 sm:pt-0 sm:px-4 first:pl-0">
              <div className="flex items-center gap-2 text-brand-600 mb-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <p className="text-xl font-bold tracking-tight text-navy-900">3 Zones</p>
              </div>
              <p className="text-xs text-slate-600">Local, Regional & National delivery tariff bands</p>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-brand-600 mb-1">
                <Scale className="h-4 w-4" aria-hidden="true" />
                <p className="text-xl font-bold tracking-tight text-navy-900">{maxWeight} kg</p>
              </div>
              <p className="text-xs text-slate-600">Maximum package booking weight capacity</p>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-brand-600 mb-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <p className="text-xl font-bold tracking-tight text-navy-900">100%</p>
              </div>
              <p className="text-xs text-slate-600">Audited status timeline with permanent timestamps</p>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-brand-600 mb-1">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <p className="text-xl font-bold tracking-tight text-navy-900">6-Digit</p>
              </div>
              <p className="text-xs text-slate-600">Secure recipient verification code at delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Categories */}
      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Standardized Tariff Bands</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">Parcel categories</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Every shipment is matched to its optimal rate band and care specifications with standard GST of {gstPercent}%.
              </p>
            </div>
            <Link
              to={ROUTES.services}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              <span>Explore full pricing rules</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="group relative flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition hover:border-brand-500/50 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-navy-900 group-hover:text-brand-700 transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.text}</p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Packaging tip:</span> {s.recommendation}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="rounded-md bg-brand-50 p-2 text-brand-700">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Need specific zone timelines?</p>
                <p className="text-xs text-slate-600">
                  Local deliveries average 2 days, Regional 4 days, and National inter-state transit 7 days.
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.services}
              className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            >
              <span>View delivery estimates</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive How It Works Stepper */}
      <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Interactive Lifecycle</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">How a parcel travels</h2>
            <p className="mt-2 text-sm text-slate-600">
              Click any stage below to inspect how customers, branches, and delivery personnel coordinate each milestone.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STEPS.map((step, idx) => {
              const isSelected = activeStep === idx
              return (
                <button
                  type="button"
                  key={step.number}
                  onClick={() => setActiveStep(idx)}
                  className={`text-left rounded-lg p-3.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {step.number}
                    </span>
                    <step.icon
                      className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-navy-900">{step.title}</p>
                  <p className="text-[11px] text-slate-500">{step.short}</p>
                </button>
              )
            })}
          </div>

          {/* Active Step Deep-Dive Showcase */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                  {STEPS[activeStep].number}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-navy-900">{STEPS[activeStep].title}</h3>
                  <p className="text-xs text-slate-600">Managed by: <span className="font-semibold text-navy-900">{STEPS[activeStep].actor}</span></p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STEPS[activeStep].badgeColor}`}>
                Status Code: {STEPS[activeStep].badge}
              </span>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What Happens</p>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{STEPS[activeStep].text}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Mechanics</p>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{STEPS[activeStep].detail}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : STEPS.length - 1))}
                className="text-xs font-medium text-slate-600 hover:text-navy-900 cursor-pointer"
              >
                ← Previous Stage
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : 0))}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 cursor-pointer"
              >
                Next Stage →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Traditional Couriers vs DispatchHub */}
      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Operational Difference</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">Why DispatchHub is different</h2>
            <p className="mt-2 text-sm text-slate-600">
              See how our synchronized digital platform eliminates standard courier frustrations.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Logistics Standard</th>
                  <th scope="col" className="px-5 py-3.5 text-slate-500">Traditional Couriers</th>
                  <th scope="col" className="px-5 py-3.5 text-brand-700 bg-brand-50/50">DispatchHub Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON.map((row) => (
                  <tr key={row.aspect} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-navy-900">{row.aspect}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-800 bg-brand-50/20">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" aria-hidden="true" />
                        <span>{row.dispatchHub}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Core Operational Strengths */}
      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Platform Features</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">Engineered for absolute trust</h2>
            <p className="mt-2 text-sm text-slate-600">
              Eliminate lost packages, unrecorded handoffs, and unexpected surcharges with structured logistics technology.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_ADVANTAGES.map((adv) => (
              <div key={adv.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600 border border-brand-100">
                  <adv.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-base font-semibold text-navy-900">{adv.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{adv.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Workspaces Showcase */}
      <section className="border-t border-slate-200 bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Access by Role</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">One platform for everyone</h2>
            <p className="mt-2 text-sm text-slate-600">
              Each stakeholder accesses specialized operational tools configured strictly for their operational responsibilities.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div key={r.role} className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col justify-between">
                <div>
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {r.badge}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-navy-900">{r.role}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to={ROUTES.about}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              <span>Learn more about DispatchHub architecture</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Frequently asked questions</h2>
            <p className="mt-2 text-sm text-slate-600">
              Find quick answers regarding our booking rules, verification codes, and tracking procedures.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.q} className="rounded-lg border border-slate-200 bg-white overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left font-medium text-navy-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? 'rotate-180 text-brand-600' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center text-sm text-slate-600">
            <span>Still have questions? </span>
            <Link to={ROUTES.contact} className="font-semibold text-brand-700 hover:underline">
              Contact our dispatch support team
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="rounded-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border border-navy-700/80 p-8 sm:p-10 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Fast & Reliable Dispatch
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Ready to send your parcel?
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Sign up for an account in seconds, calculate instant shipping quotes, and track every delivery milestone
                  with complete peace of mind.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to={bookTo}
                  className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
                >
                  {profile ? 'Go to dashboard' : 'Book a parcel now'}
                </Link>
                <Link
                  to={ROUTES.contact}
                  className="rounded-md border border-navy-600 bg-navy-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-navy-800 hover:text-white transition-colors"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
