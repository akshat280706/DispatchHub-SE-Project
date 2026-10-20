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

## Status
- Batch 0, 1, 2A, 2B, 2C, 2D-1: COMPLETE
- Batch 2D-2 (assignment/status/OTP/verification/complaint RPCs): SQL delivered, awaiting test
- Next: 2D-3 (stats RPCs get_customer_stats/get_personnel_stats/get_branch_stats/get_admin_stats, demo staff + demo parcels, full end-to-end SQL test)

## Batch 2D-2 notes
- File: supabase/migrations/0005_rpc_delivery_complaints.sql
- Added column delivery_verifications.dev_otp (plain OTP only while setting dev.show_delivery_otp = true; cleared on success/failure; no client grants)
- Internal helpers (no client EXECUTE): get_setting_bool, notify_branch_managers
- Client RPCs (authenticated):
  - assign_parcel(parcel_id, personnel_id, type PICKUP|DELIVERY, reason) -> assignment row. Reason required to reassign. PICKUP allowed at CONFIRMED/ASSIGNED (origin manager), DELIVERY at AT_DESTINATION_BRANCH/OUT_FOR_DELIVERY/DELIVERY_FAILED (destination manager). Admin any. PICKUP at CONFIRMED -> ASSIGNED.
  - update_parcel_status(parcel_id, new_status, note, location_note): only ASSIGNED>PICKED_UP (assigned pickup person/admin), PICKED_UP>IN_TRANSIT (origin mgr), IN_TRANSIT>AT_DESTINATION_BRANCH (dest mgr), DELIVERY_FAILED>RETURNED (dest mgr, note required). DELIVERED rejected.
  - start_delivery(parcel_id): assigned DELIVERY person only; AT_DESTINATION_BRANCH/DELIVERY_FAILED -> OUT_FOR_DELIVERY; creates OTP (hash + expiry + max attempts from settings)
  - get_dev_delivery_otp(parcel_id): owner only, dev mode only -> {otp, expires_at, attempts_left, notice} or null
  - register_delivery_proof(parcel_id, storage_path, proof_type) -> proof id (file must exist in bucket delivery-proofs under {parcel_id}/)
  - verify_delivery(parcel_id, otp, proof_ids[]) -> {verified:true,status} | {verified:false,attempts_left}; errors for expired/locked/missing proof (if delivery.require_photo)
  - record_delivery_failure(parcel_id, reason) -> DELIVERY_FAILED; reason stored in location_note (not public)
  - update_complaint(complaint_id, status, notes): OPEN>IN_REVIEW>RESOLVED(notes required)>CLOSED, RESOLVED>IN_REVIEW allowed; notifies customer
- Upload flow for frontend (Batch 7): upload file to storage path {parcel_id}/{uuid}.jpg, then call register_delivery_proof, then pass returned ids to verify_delivery.

## Status
- Batch 0, 1, 2A, 2B, 2C, 2D-1, 2D-2: COMPLETE
- Batch 2D-3 (stats RPCs, demo staff, demo parcels, e2e test): delivered, awaiting test (e2e report must say ALL STEPS PASSED)
- Next: merge b2-database PR, then Batch 3 (Authentication)

## Batch 2D-3 notes
- Files: supabase/migrations/0006_stats_functions.sql, supabase/seed_demo_staff.sql, supabase/seed_demo_parcels.sql, supabase/tests/e2e_parcel_journey.sql
- Stats RPCs (authenticated, role-checked; dates in Asia/Kolkata, default last 30 days, max 366):
  - get_customer_stats() -> total_bookings, active_shipments, delivered, cancelled, open_complaints, unread_notifications
  - get_personnel_stats() -> assigned_total, pending_pickups, pending_deliveries, out_for_delivery, completed_pickups, completed_deliveries, completed_today
  - get_branch_stats(from, to, branch_id[admin only]) -> branch, from, to, parcel_count, by_status{}, pending_assignments, in_transit, delayed, personnel[{id,full_name,is_available,active_assignments}], complaints{status:n}, daily[{date,bookings}]
  - get_admin_stats(from, to) -> users{total,active,by_role}, parcels{total,active,delivered,cancelled,delayed,in_range,by_status}, payments{success/pending/failed/refunded counts+amounts}, branches[{code,name,city,origin_parcels,destination_parcels,active_parcels}], complaints{status:n}, daily[{date,bookings,revenue}]
- Demo accounts (password Test@12345, dev only): admin@, manager.mum@ (MUM01), manager.pun@ (PUN01), rider.mum@ (MUM01), rider.pun@ (PUN01), customer@ (all @dispatchhub.test)
- Demo parcels: 8 via idempotency keys demo-seed-001..008 (BOOKED, CONFIRMED, ASSIGNED, IN_TRANSIT+delayed, AT_DESTINATION_BRANCH, OUT_FOR_DELIVERY, DELIVERED, CANCELLED+refunded) + 2 complaints
- Known gap: cash-on-pickup payments remain PENDING (add cash-collected step in Batch 6/7)
- Database layer (Batch 2) is complete once the e2e test passes

## Status
- Batch 0, 1, 2 (2A-2D-3): COMPLETE (database done, e2e passed)
- Batch 3 (Authentication): code delivered, awaiting test
- Next: Batch 4 (Public website)

## Batch 3 notes
- Auth: src/services/authService.ts (signUp, signIn, signOut, getProfile). Role never sent on signup (DB trigger = CUSTOMER). Inactive accounts are signed out.
- Context: src/context/authContext.ts (context + AuthContextValue), AuthProvider.tsx; hook src/hooks/useAuth.ts -> { session, user, profile, role, loading, signOut, refreshProfile }
- Guards (src/app/guards.tsx): ProtectedRoute, RoleRoute(roles), PublicOnlyRoute, RoleHomeRedirect (/app). UX only; RLS/RPC enforce.
- Navigation: src/lib/navigation.ts (ROLE_HOME, ROLE_LABEL, ROLE_NAV with ready flags; set ready:true when a page is built)
- Route prefix per role: /app/customer, /app/delivery, /app/manager, /app/admin; sub-pages go under those prefixes (e.g. /app/customer/book)
- UI: components/ui Button (variant, loading), Input (label, error, hint; forwardRef), Spinner/FullPageSpinner; layout AuthLayout, DashboardLayout (role sidebar, mobile drawer, sign out)
- Schemas: src/schemas/auth.ts (loginSchema, registerSchema)
- Errors: src/lib/errors.ts (AppError, friendlyAuthError, getErrorMessage)
- Placeholder: pages/app/DashboardHome.tsx (shows RLS-limited parcel count) replaced per role in Batches 5, 7, 8, 9
- Dev login buttons on /login only in import.meta.env.DEV


