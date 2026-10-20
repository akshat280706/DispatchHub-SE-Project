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


## Status
- Batch 0, 1, 2A: COMPLETE
- Batch 2B (parcels, tracking_events, delivery_assignments, payments, delivery_verifications, delivery_proofs, complaints, notifications, audit_logs, contact_messages): SQL delivered, awaiting test
- Next: 2C (RLS + storage), 2D (RPC functions + seed)

## Batch 2B notes
- File: supabase/migrations/0002_operational_tables.sql
- parcels CHECKs: total = charge + tax; CANCELLED needs cancelled_reason; DELIVERED <=> delivered_at set
- Unique: parcels(customer_id, idempotency_key); one ACTIVE assignment per (parcel, type); one SUCCESS payment per parcel; payments(provider, transaction_reference)
- delivery_verifications has is_active (partial unique per parcel); new OTP row per attempt cycle
- tracking_events and audit_logs blocked from UPDATE/DELETE by trigger block_modification()
- No cascade deletes except notifications -> profiles


## Status
- Batch 0, 1, 2A, 2B: COMPLETE
- Batch 2C (RLS + grants + storage bucket): SQL delivered, awaiting test
- Next: 2D (RPC functions + seed data)

## Batch 2C notes
- File: supabase/migrations/0003_rls_and_storage.sql
- Grants: revoke all from anon/authenticated, then explicit grants. NEW TABLES NEED EXPLICIT GRANTS.
- No client writes on: parcels, tracking_events, delivery_assignments, payments, delivery_verifications (no grants at all), delivery_proofs, audit_logs.
- Direct client writes allowed: profiles (own; trigger protects role/branch/is_active/email), notifications.is_read (own), complaints INSERT (own parcel, status OPEN), contact_messages INSERT (anon ok), admin-only on branches/shipping_rates/system_settings.
- Helpers: is_manager_of_parcel, is_assigned_to_parcel (ACTIVE or COMPLETED), owns_parcel, can_view_parcel, can_upload_proof (DELIVERY assignment ACTIVE + parcel OUT_FOR_DELIVERY), try_uuid.
- complaints.complaint_number set by trigger (CMP-YYMMDD-XXXX); client value ignored.
- Storage: private bucket delivery-proofs (5 MB, jpeg/png/webp). Path {parcel_id}/{filename}. Insert: assigned personnel only. Select: anyone who can_view_parcel. No update/delete.
- Public tracking will be via RPC track_parcel() (2D), not table access.
- In RPCs use search_path = public, extensions (pgcrypto lives in extensions schema).

## Status
- Batch 0, 1, 2A, 2B, 2C: COMPLETE
- Batch 2D-1 (booking/tracking/payment RPCs + reference seed): SQL delivered, awaiting test
- Next: 2D-2 (assign_parcel, update_parcel_status, start_delivery, get_dev_delivery_otp, verify_delivery, record_delivery_failure, update_complaint, stats RPCs, demo users + parcels)

## Batch 2D-1 notes
- Files: supabase/migrations/0004_rpc_booking_tracking_payments.sql, supabase/seed.sql
- Internal helpers (no client EXECUTE): get_setting_numeric, notify_user, add_tracking_event (uses clock_timestamp), write_audit, generate_tracking_number
- Client RPCs (authenticated): calculate_shipping_quote(origin, dest, category, weight, l, w, h), create_parcel_booking(payload jsonb, idempotency_key), cancel_parcel(parcel_id, reason) -> {id,status}
- Public RPC (anon + authenticated): track_parcel(tracking_number) -> jsonb or null
- Service-role only: apply_payment_result(payment_id, status SUCCESS|FAILED, provider, transaction_reference, failure_reason) idempotent
- Booking payload keys: origin_branch_id, destination_branch_id, sender_name, sender_phone, pickup_address, receiver_name, receiver_phone, delivery_address, delivery_city, delivery_pincode, category, weight_kg, length_cm, width_cm, height_cm, description, special_instructions, payment_method (ONLINE|DEV_SIMULATED|CASH_ON_PICKUP)
- Pricing: zone by branch city/state; charge = base + ceil_0.5(weight - base_weight) * per_kg + handling; GST from settings (18%)
- Seed: 6 branches (MUM01, MUM02, PUN01, DEL01, BLR01, AMD01), 18 rates, 12 settings incl. dev.show_delivery_otp
- Cash on pickup => CONFIRMED at booking. Online/dev => CONFIRMED by apply_payment_result.
- Any new RPC must have explicit revoke/grant execute lines.

