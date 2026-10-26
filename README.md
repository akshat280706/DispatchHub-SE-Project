<div align="center">

# 📦 DispatchHub - Courier Service Management System

**Every Parcel. Every Step. Under Control.**

Book, pay, assign, track and deliver parcels across branches, with four role-based workspaces on one secure platform.

![React](https://img.shields.io/badge/React-Vite-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E.svg)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000.svg)

**[Live Demo](https://YOUR-APP.vercel.app)** · **[Report a Bug](https://github.com/akshat280706/DispatchHub-SE-Project/issues)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Parcel Lifecycle](#-parcel-lifecycle)
- [Tech Stack](#-tech-stack)
- [Architecture and Security](#-architecture-and-security)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Edge Functions](#-edge-functions)
- [Running the Application](#-running-the-application)
- [Database Schema](#-database-schema)
- [Database Functions (API)](#-database-functions-api)
- [User Roles and Routes](#-user-roles-and-routes)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Known Limitations](#-known-limitations)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Authors](#-authors)
- [Acknowledgments](#-acknowledgments)

---

## 🎯 Overview

DispatchHub is a web-based courier management platform built as a Software Engineering course project. It covers the
whole delivery lifecycle, from booking and payment to delivery confirmation, and connects four kinds of users through
one database:

- **Customers** book parcels, pay, track shipments and raise complaints.
- **Delivery personnel** handle pickups and deliveries and verify handovers with a code and a photo.
- **Branch managers** run the parcels moving through their branch and assign delivery partners.
- **Administrators** manage users, branches, shipping rates, settings and system-wide reports.


---

## ✨ Features

### For Customers
- 📝 **Parcel booking** with a live server-calculated price quote and full cost breakdown
- 🔁 **Duplicate-safe booking**: double-clicking never creates two parcels
- 💳 **Development payment flow** with simulated success and failure, confirmed by the server
- 🔎 **Booking history** with search, status filter, date range and pagination
- ❌ **Cancellation** with explicit rules and a confirmation dialog
- 🔔 **Notifications** with an unread bell, mark as read, and filters
- 📣 **Complaints** raised against your own parcels, followed through to resolution
- 🔑 **Delivery code** shown on the parcel page when it is out for delivery

### For Delivery Personnel
- 📋 **Assignments** for pickups and deliveries, scoped to the rider
- ✅ **Pickup, cash collection and start delivery** actions
- 📸 **Photo proof** uploaded to a private storage bucket (resized before upload)
- 🔐 **Code verification** with expiry and an attempt limit; the only path to `DELIVERED`
- ⚠️ **Failed attempts** with a recorded reason and retry
- 🕘 **History** with filters and pagination, plus an availability toggle

### For Branch Managers
- 📊 **Dashboard**: branch parcels, pending assignments, in transit, delayed, rider availability
- 🗂 **Work queue**: pickups to assign, parcels to dispatch, arrivals, deliveries to assign
- 🚚 **Assign or reassign** riders (with a reason), dispatch, confirm arrival, return to sender, cancel
- 👥 **Personnel monitoring** with workload and completed counts
- 🛠 **Complaint review**: Open → In review → Resolved → Closed, with resolution notes
- 📈 **Branch reports** with date filters and charts

### For Administrators
- 🧑‍💼 **User management**: search, filter, change role, branch and active status
- ➕ **Staff creation** through a server-side function (service key never reaches the browser)
- 🏢 **Branches, shipping rates and system settings** with validation
- 🧾 **Audit log** viewer with filters; entries are append-only
- 📬 **Contact messages** inbox
- 📉 **System reports** with a branch drill-down and CSV export

### General
- 🌐 **Public website**: Home, About, Services, Track Parcel, Contact, Privacy Policy, Terms of Service
- 🛰 **Public tracking** that returns only status, branch cities and timeline, never personal data
- 📱 **Responsive** layouts with a mobile drawer for dashboards
- ♿ **Accessible** forms: labels, keyboard support, `role="alert"` errors, Esc to close dialogs
- 🔒 **Password management**: change password, forgot and reset password
- 🚦 **Rate limiting** on public tracking and the contact form

---

## 🔄 Parcel Lifecycle

```
BOOKED ─► CONFIRMED ─► ASSIGNED ─► PICKED_UP ─► IN_TRANSIT ─► AT_DESTINATION_BRANCH
  │           │            │                                            │
  └───────────┴────────────┴──► CANCELLED                              ▼
                                                              OUT_FOR_DELIVERY ◄──┐
                                                                │            │    │ retry
                                                                ▼            ▼    │
                                                            DELIVERED   DELIVERY_FAILED ─► RETURNED
```

| Transition | Who | Rule |
|---|---|---|
| BOOKED → CONFIRMED | System | Payment recorded, or cash on pickup |
| CONFIRMED → ASSIGNED | Origin manager | Creates a pickup assignment |
| ASSIGNED → PICKED_UP | Assigned pickup rider | Must hold the active pickup assignment |
| PICKED_UP → IN_TRANSIT | Origin manager | |
| IN_TRANSIT → AT_DESTINATION_BRANCH | Destination manager | |
| AT_DESTINATION_BRANCH → OUT_FOR_DELIVERY | Assigned delivery rider | Generates the delivery code |
| OUT_FOR_DELIVERY → DELIVERED | **Only** `verify_delivery()` | Correct code (and photo if required) |
| OUT_FOR_DELIVERY → DELIVERY_FAILED | Assigned delivery rider | Reason required |
| DELIVERY_FAILED → RETURNED | Destination manager | Note required |

Terminal states: `DELIVERED`, `RETURNED`, `CANCELLED`. Every change writes an append-only tracking event in the same
transaction.

---

## 🛠 Tech Stack

### Frontend
- **React + Vite + TypeScript** (strict)
- **Tailwind CSS v4** for styling
- **React Router** for routing
- **React Hook Form + Zod** for forms and validation
- **Recharts** for dashboards and reports
- **Lucide React** for icons

### Backend
- **Supabase PostgreSQL** with Row Level Security
- **Supabase Auth** for sessions
- **Supabase Storage** (private bucket) for delivery proof photos
- **PL/pgSQL functions** for every sensitive write
- **Supabase Edge Functions** (Deno) for payment simulation and staff creation

### Hosting
- **Vercel** (frontend) and **Supabase** (backend)

---

## 🔐 Architecture and Security

```
Browser (React) ──supabase-js, publishable key + user JWT──► Supabase
                                                     ├─ Auth
                                                     ├─ Postgres (RLS + SECURITY DEFINER functions)
                                                     ├─ Storage (private bucket)
                                                     └─ Edge Functions (service role, server only)
```

- **Reads** go through Row Level Security. Each role sees only what it needs.
- **Writes** to parcels, tracking events, assignments, payments, delivery verifications and audit logs are **not granted**
  to the browser. They happen only in database functions that check `auth.uid()`, role, branch and current state.
- **New accounts are always customers.** Roles change only through an audited admin function. A trigger blocks
  non-admins from editing role, branch, status or email.
- **Payment results** are applied only by a server-side function. The browser never marks a payment successful.
- **Public tracking** is a database function returning non-sensitive fields only. It is rate limited.
- **Delivery codes** are stored hashed. The table has no client grants at all.
- **Proof photos** live in a private bucket and are opened with short-lived signed links.
- **Audit logs** and **tracking events** are append-only (enforced by triggers).
- **Secrets**: the service-role key exists only in Edge Function secrets, never in `src/`.

---

## 📁 Project Structure

```
DispatchHub-SE-Project/
├── src/
│   ├── app/                  # router, route constants, guards
│   ├── components/
│   │   ├── ui/               # Button, Input, Select, Modal, Pagination, StatusBadge ...
│   │   ├── layout/           # PublicLayout, Navbar, Footer, DashboardLayout, AuthLayout
│   │   └── domain/           # TrackingTimeline, CostBreakdown, AssignDialog, NotificationBell ...
│   ├── context/              # AuthProvider
│   ├── hooks/                # useAuth, useAsyncData, useDebounce, useUnreadCount ...
│   ├── lib/                  # supabase client, formatters, errors, navigation, per-role route maps
│   ├── pages/
│   │   ├── public/           # Home, About, Services, TrackParcel, Contact, Privacy, Terms
│   │   ├── auth/             # Login, Register, ForgotPassword, ResetPassword
│   │   ├── app/              # Account, Notifications (shared)
│   │   ├── customer/         # Dashboard, BookParcel, MyBookings, BookingDetail, PayBooking ...
│   │   ├── delivery/         # Dashboard, Assignments, AssignmentDetail, History
│   │   ├── manager/          # Dashboard, Parcels, WorkQueue, Personnel, Complaints, Reports
│   │   └── admin/            # Dashboard, Users, Branches, Rates, Settings, Audit, Messages, Reports
│   ├── schemas/              # Zod schemas
│   ├── services/             # one service per module (parcel, payment, delivery, admin ...)
│   └── types/                # database, api and tracking types
├── supabase/
│   ├── migrations/           # 0001 to 0011, run in order
│   ├── functions/            # dev-payment-simulate, admin-create-user
│   ├── tests/                # e2e_parcel_journey.sql
├── vercel.json               # single-page-app rewrite
├── .env.example
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** 20 or newer
- **Git**
- A free **Supabase** project

### Clone and install
```bash
git clone https://github.com/akshat280706/DispatchHub-SE-Project.git
cd DispatchHub-SE-Project
npm install
```

---

## ⚙️ Configuration

Create `.env.local` in the project root (never commit it):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Only the **publishable** key belongs in the frontend. The secret / service-role key must never be used there.

In the Supabase dashboard:
1. **Authentication → Providers → Email:** turn off "Confirm email" for development.
2. **Authentication → URL Configuration:** set Site URL to `http://localhost:5173` and add
   `http://localhost:5173/reset-password` to Redirect URLs. Add your deployed URL too when you deploy.

---

## 🗄️ Database Setup

In the Supabase **SQL Editor**, run each file **once**, in this order:

| # | File | Purpose |
|---|---|---|
| 1 | `migrations/0001_enums_core_tables.sql` | Enums, profiles, branches, settings, rates, signup trigger |
| 2 | `migrations/0002_operational_tables.sql` | Parcels, events, assignments, payments, complaints ... |
| 3 | `migrations/0003_rls_and_storage.sql` | Grants, RLS policies, private storage bucket |
| 4 | `migrations/0004_rpc_booking_tracking_payments.sql` | Quote, booking, cancel, public tracking |
| 5 | `seed.sql` | Branches, rates, settings (safe to re-run) |
| 6 | `migrations/0005_rpc_delivery_complaints.sql` | Assignment, status, OTP, verification, complaints |
| 7 | `migrations/0006_stats_functions.sql` | Dashboard statistics |
| 8 | `migrations/0007_payment_functions.sql` | Payment retry, cash collection |
| 9 | `migrations/0008_rider_cash_due.sql` | Rider cash-due lookup |
| 10 | `migrations/0009_admin_user_management.sql` | Audited user changes |
| 11 | `migrations/0010_admin_config.sql` | Audited branch, rate and setting changes |
| 12 | `migrations/0011_rate_limits_complaint_alerts.sql` | Rate limiting, contact function, complaint alerts |

---

## ⚡ Edge Functions

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase secrets set DEV_PAYMENTS_ENABLED=true
npx supabase functions deploy dev-payment-simulate
npx supabase functions deploy admin-create-user
```

| Function | Purpose |
|---|---|
| `dev-payment-simulate` | Simulates a payment result after checking the caller owns the payment. Refuses to run unless `DEV_PAYMENTS_ENABLED=true`. |
| `admin-create-user` | Creates staff accounts. Only an active admin may call it. Uses the service role on the server. |

If Docker is not running, the CLI uploads through the API, which is fine.

---

## 🏃 Running the Application

```bash
npm run dev       # development server at http://localhost:5173
npm run build     # type-check and production build
npm run preview   # serve the production build locally
npm run lint
```

---

## 🗄️ Database Schema

15 tables, all with Row Level Security enabled:

| Table | Purpose |
|---|---|
| `profiles` | Users linked to Supabase Auth, with role and branch |
| `branches` | Courier branches (code, city, state) |
| `system_settings` | GST, limits, delivery rules, public contact details |
| `shipping_rates` | Rates per zone and category |
| `parcels` | Bookings with sender, receiver, charges and current status |
| `tracking_events` | **Append-only** status history |
| `delivery_assignments` | Pickup and delivery assignments (one active per parcel and type) |
| `payments` | Payment records (one successful payment per parcel) |
| `delivery_verifications` | Hashed delivery codes, expiry, attempts (no client access) |
| `delivery_proofs` | References to proof photos in private storage |
| `complaints` | Customer complaints with lifecycle |
| `notifications` | In-app notifications |
| `audit_logs` | **Append-only** audit trail |
| `contact_messages` | Messages from the public contact form |
| `rate_limits` | Counters for rate limiting (no client access) |

Money uses `numeric(10,2)` in INR, and the database checks that `total = shipping + tax`.

---

## 📡 Database Functions (API)

The app calls these through `supabase.rpc(...)`. Each validates the caller, role, branch and state.

| Function | Callable by | Purpose |
|---|---|---|
| `calculate_shipping_quote` | Signed-in | Zone, rate lookup and cost breakdown |
| `create_parcel_booking` | Customer | Creates a parcel, event, payment and notification (idempotent) |
| `cancel_parcel` | Owner, manager, admin | Cancels with a reason |
| `track_parcel` | Anyone | Public tracking, non-sensitive fields, rate limited |
| `create_payment_attempt` | Customer | Pending development payment for a booked parcel |
| `apply_payment_result` | **Server only** | Applies a payment result (idempotent) |
| `mark_cash_collected` | Pickup rider, origin manager, admin | Records cash |
| `assign_parcel` | Manager, admin | Assign or reassign (reason required) |
| `update_parcel_status` | Rider, manager, admin | Validated transitions (never `DELIVERED`) |
| `start_delivery` | Delivery rider | Out for delivery and creates the code |
| `verify_delivery` | Delivery rider | The only path to `DELIVERED` |
| `record_delivery_failure` | Delivery rider | Records a failed attempt |
| `update_complaint` | Manager, admin | Complaint lifecycle |
| `get_customer_stats` / `get_personnel_stats` / `get_branch_stats` / `get_admin_stats` | Per role | Dashboard numbers from real rows |
| `admin_update_user` / `admin_upsert_branch` / `admin_upsert_rate` / `admin_update_setting` | Admin | Audited configuration changes |
| `submit_contact_message` | Anyone | Rate-limited contact form |

---

## 👥 User Roles and Routes

| Role | Home | Highlights |
|---|---|---|
| Customer | `/app/customer` | `/book`, `/bookings`, `/complaints`, `/notifications`, `/profile` |
| Delivery personnel | `/app/delivery` | `/assignments`, `/history`, `/notifications` |
| Branch manager | `/app/manager` | `/parcels`, `/assign`, `/personnel`, `/complaints`, `/reports` |
| Administrator | `/app/admin` | `/users`, `/branches`, `/rates`, `/settings`, `/complaints`, `/messages`, `/audit`, `/reports` |

Public pages: `/`, `/about`, `/services`, `/track`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`.
Route guards only improve the user experience. The real enforcement is Row Level Security and the database functions.

---


## 🚢 Deployment

**Frontend (Vercel):**
1. Import the GitHub repo. The preset is Vite (build `npm run build`, output `dist`).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables.
3. `vercel.json` rewrites all paths to `index.html` so deep links work.
4. In Supabase, add the Vercel URL to **Authentication → URL Configuration**.

**Backend:** Supabase hosts the database, auth, storage and Edge Functions. Free projects pause after about a week of
inactivity, so open the site before a demo.

---

## ⚠️ Known Limitations

- Development payment only. No real payment provider is connected.
- Delivery codes are shown in the app. No SMS or email provider is connected.
- Notifications refresh by polling (30 seconds), not realtime push.
- No GPS tracking. Tracking events are recorded when staff update a step.
- Rate limiting is header-based best effort.
- Signature proof is not built. Photo proof plus code is.
- Privacy Policy and Terms of Service are editable project text, not legal advice.
- Shipping price is based on zone and weight. Parcel dimensions are stored but do not affect price.

---


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m "Add some AmazingFeature"`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please keep database changes in a new numbered migration and give every new function explicit `grant` and `revoke` lines.

---

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Styling by [Tailwind CSS](https://tailwindcss.com/)
- Backend by [Supabase](https://supabase.com/)
- Charts by [Recharts](https://recharts.org/)
- Font: [Inter](https://rsms.me/inter/) via Fontsource

---

## 🔗 Links

- **Live Demo:** dispatch-hub-se-project.vercel.app
- **Repository:** https://github.com/akshat280706/DispatchHub-SE-Project

---

<div align="center">

⭐ Star this repo if you find it helpful!
</div>