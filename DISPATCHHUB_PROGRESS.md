# DispatchHub Progress Handover

## Status
- Batch 0 (Architecture contract): COMPLETE (design only, no code yet)
- Next: Batch 1 (Project Foundation)

## Stack (final)
React + Vite + TypeScript + Tailwind + React Router + Lucide + React Hook Form + Zod + Recharts
Supabase: Auth, Postgres + RLS, Storage (private bucket delivery-proofs), Edge Functions. No Express.
Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (frontend only). Service-role key never in frontend.

## Architecture rules
- Clients READ via RLS. Sensitive WRITES (parcels, tracking_events, delivery_assignments, payments,
  delivery_verifications, audit_logs) only via SECURITY DEFINER RPCs or Edge Functions.
- Signup trigger always creates role CUSTOMER. Trigger blocks role/branch_id/is_active edits by non-admins.
- Public tracking only via RPC track_parcel() returning non-sensitive fields.
- DELIVERED only reachable through verify_delivery().
- TS types mirror DB snake_case column names.

## Tables
profiles, branches, system_settings, shipping_rates, parcels, tracking_events, delivery_assignments,
payments, delivery_verifications, delivery_proofs, complaints, notifications, audit_logs, contact_messages
(column-level detail: see Batch 0 response; do not rename)

## Status lifecycle
BOOKED>CONFIRMED>ASSIGNED>PICKED_UP>IN_TRANSIT>AT_DESTINATION_BRANCH>OUT_FOR_DELIVERY>DELIVERED
OUT_FOR_DELIVERY>DELIVERY_FAILED>(OUT_FOR_DELIVERY | RETURNED)
BOOKED/CONFIRMED/ASSIGNED>CANCELLED. Terminal: DELIVERED, RETURNED, CANCELLED.

## RPC list
generate_tracking_number, calculate_shipping_quote, create_parcel_booking, cancel_parcel, assign_parcel,
update_parcel_status, start_delivery, get_dev_delivery_otp, verify_delivery, record_delivery_failure,
update_complaint, track_parcel, get_customer_stats, get_personnel_stats, get_branch_stats,
get_admin_stats, apply_payment_result (service-role only)

## Edge Functions
create-payment-order, verify-payment, razorpay-webhook, dev-payment-simulate (needs DEV_PAYMENTS_ENABLED),
admin-create-user, send-external-notification (optional)

## Folder structure
As defined in Batch 0 section 3 (src/app, lib, types, schemas, context, services, hooks, components, pages; supabase/migrations, functions)

## Decisions
- Pricing by zone (LOCAL/REGIONAL/NATIONAL from branch city/state), no real distance.
- Dev OTP shown to the customer, labelled as development-only. Dev payments labelled as simulated.
- Email confirmation disabled in dev Supabase project.

## Open items
- None blocking. Supabase project must be created and URL + publishable key noted before Batch 1 testing.

## Status
- Batch 0: COMPLETE
- Batch 1 (Foundation): code delivered, awaiting test result (/setup-check all green + npm run build OK)
- Next: Batch 2 (Database and Security)

## Batch 1 decisions
- Tailwind CSS v4 via @tailwindcss/vite. No tailwind.config.ts or postcss.config.js; theme tokens are in src/index.css (@theme).
- Colours: navy-900/800/700, brand (teal) 500/600/700. Font: Inter Variable (@fontsource-variable/inter).
- Router: react-router-dom createBrowserRouter in src/app/router.tsx; route constants in src/app/routes.ts.
- Supabase client: src/lib/supabaseClient.ts exports supabase, supabaseUrl, supabasePublishableKey, isSupabaseConfigured.
- Helpers: src/lib/format.ts (formatINR, formatDate, formatDateTime, formatStatus), src/lib/constants.ts (APP_NAME, APP_TAGLINE, COPYRIGHT_TEXT, PARCEL_STATUSES).
- Temporary pages: Home (stub), /setup-check (remove before final), NotFound.
- Relative imports, no path alias.


## Status
- Batch 0, 1: COMPLETE
- Batch 2A (enums, branches, profiles, system_settings, shipping_rates, helpers, signup trigger): SQL delivered, awaiting test
- Next: 2B (parcels, tracking_events, assignments, payments, verifications, proofs, complaints, notifications, audit_logs, contact_messages), 2C (RLS + storage), 2D (RPC functions + seed)

## Batch 2A notes
- File: supabase/migrations/0001_enums_core_tables.sql (run in SQL Editor)
- Helpers: current_user_role(), current_branch_id(), is_admin() (SECURITY DEFINER)
- Triggers: set_updated_at, handle_new_user (always CUSTOMER), protect_profile_columns (blocks role/branch/is_active/email changes by non-admins)
- Added system_settings.is_public (for anon-readable keys)
- Constraint: staff roles require branch_id
- Git: branch b2-database