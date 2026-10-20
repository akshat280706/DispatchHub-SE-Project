-- =====================================================================
-- DispatchHub 0002: operational tables
-- Run once in Supabase SQL Editor, after 0001.
-- =====================================================================

-- ---------- parcels ----------
create table parcels (
  id                    uuid primary key default gen_random_uuid(),
  tracking_number       text not null unique,
  customer_id           uuid not null references profiles(id),
  origin_branch_id      uuid not null references branches(id),
  destination_branch_id uuid not null references branches(id),

  sender_name           text not null,
  sender_phone          text not null,
  pickup_address        text not null,
  receiver_name         text not null,
  receiver_phone        text not null,
  delivery_address      text not null,
  delivery_city         text not null,
  delivery_pincode      text not null check (delivery_pincode ~ '^[0-9]{6}$'),

  category              parcel_category not null,
  weight_kg             numeric(6,2) not null check (weight_kg > 0),
  length_cm             numeric(6,2) check (length_cm is null or length_cm > 0),
  width_cm              numeric(6,2) check (width_cm  is null or width_cm  > 0),
  height_cm             numeric(6,2) check (height_cm is null or height_cm > 0),
  description           text,
  special_instructions  text,

  zone                  rate_zone not null,
  shipping_charge       numeric(10,2) not null check (shipping_charge >= 0),
  tax_amount            numeric(10,2) not null check (tax_amount >= 0),
  total_amount          numeric(10,2) not null check (total_amount >= 0),

  status                parcel_status not null default 'BOOKED',
  estimated_delivery_date date,
  idempotency_key       text,
  cancelled_reason      text,
  delivered_at          timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint parcels_total_chk check (total_amount = shipping_charge + tax_amount),
  constraint parcels_cancel_reason_chk check (status <> 'CANCELLED' or cancelled_reason is not null),
  constraint parcels_delivered_at_chk check ((status = 'DELIVERED') = (delivered_at is not null)),
  constraint parcels_idempotency_uq unique (customer_id, idempotency_key)
);
create index parcels_customer_idx    on parcels (customer_id, created_at desc);
create index parcels_origin_idx      on parcels (origin_branch_id, status);
create index parcels_destination_idx on parcels (destination_branch_id, status);
create index parcels_status_idx      on parcels (status);
create trigger parcels_updated_at before update on parcels
  for each row execute function set_updated_at();

-- ---------- tracking_events (append-only history) ----------
create table tracking_events (
  id            uuid primary key default gen_random_uuid(),
  parcel_id     uuid not null references parcels(id),
  status        parcel_status not null,
  branch_id     uuid references branches(id),
  location_note text,
  description   text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);
create index tracking_events_parcel_idx on tracking_events (parcel_id, created_at);

-- ---------- delivery_assignments ----------
create table delivery_assignments (
  id              uuid primary key default gen_random_uuid(),
  parcel_id       uuid not null references parcels(id),
  personnel_id    uuid not null references profiles(id),
  assigned_by     uuid not null references profiles(id),
  assignment_type assignment_type not null,
  status          assignment_status not null default 'ACTIVE',
  reassign_reason text,
  assigned_at     timestamptz not null default now(),
  completed_at    timestamptz,
  constraint assignments_reassign_reason_chk
    check (status <> 'REASSIGNED' or reassign_reason is not null)
);
-- at most ONE active assignment per parcel and type (prevents conflicts)
create unique index assignments_one_active_uq
  on delivery_assignments (parcel_id, assignment_type) where status = 'ACTIVE';
create index assignments_personnel_idx on delivery_assignments (personnel_id, status);
create index assignments_parcel_idx    on delivery_assignments (parcel_id);

-- ---------- payments ----------
create table payments (
  id                    uuid primary key default gen_random_uuid(),
  parcel_id             uuid not null references parcels(id),
  customer_id           uuid not null references profiles(id),
  amount                numeric(10,2) not null check (amount >= 0),
  currency              text not null default 'INR' check (currency = 'INR'),
  method                payment_method not null,
  status                payment_status not null default 'PENDING',
  provider              text,
  provider_order_id     text,
  transaction_reference text,
  failure_reason        text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint payments_paid_at_chk check (status <> 'SUCCESS' or paid_at is not null)
);
create index payments_parcel_idx   on payments (parcel_id);
create index payments_customer_idx on payments (customer_id, created_at desc);
-- same provider reference can never be processed twice
create unique index payments_provider_ref_uq
  on payments (provider, transaction_reference) where transaction_reference is not null;
-- a parcel can have only one successful payment
create unique index payments_one_success_uq
  on payments (parcel_id) where status = 'SUCCESS';
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- ---------- delivery_verifications (OTP) ----------
-- A new row is created per OTP; older ones become is_active = false.
create table delivery_verifications (
  id           uuid primary key default gen_random_uuid(),
  parcel_id    uuid not null references parcels(id),
  otp_hash     text not null,
  expires_at   timestamptz not null,
  attempts     int  not null default 0 check (attempts >= 0),
  max_attempts int  not null default 5 check (max_attempts > 0),
  is_active    boolean not null default true,
  verified_at  timestamptz,
  verified_by  uuid references profiles(id),
  is_dev_mode  boolean not null default true,
  created_at   timestamptz not null default now()
);
create unique index delivery_verifications_active_uq
  on delivery_verifications (parcel_id) where is_active;

-- ---------- delivery_proofs ----------
create table delivery_proofs (
  id           uuid primary key default gen_random_uuid(),
  parcel_id    uuid not null references parcels(id),
  uploaded_by  uuid not null references profiles(id),
  proof_type   proof_type not null default 'PHOTO',
  storage_path text not null,
  created_at   timestamptz not null default now(),
  constraint delivery_proofs_path_uq unique (storage_path)
);
create index delivery_proofs_parcel_idx on delivery_proofs (parcel_id);

-- ---------- complaints ----------
create table complaints (
  id               uuid primary key default gen_random_uuid(),
  complaint_number text not null unique,
  parcel_id        uuid not null references parcels(id),
  customer_id      uuid not null references profiles(id),
  subject          text not null check (char_length(subject) between 3 and 150),
  description      text not null check (char_length(description) between 10 and 2000),
  status           complaint_status not null default 'OPEN',
  resolution_notes text,
  handled_by       uuid references profiles(id),
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index complaints_status_idx   on complaints (status);
create index complaints_customer_idx on complaints (customer_id, created_at desc);
create index complaints_parcel_idx   on complaints (parcel_id);
create trigger complaints_updated_at before update on complaints
  for each row execute function set_updated_at();

-- ---------- notifications ----------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  message    text not null,
  parcel_id  uuid references parcels(id),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- ---------- audit_logs (append-only) ----------
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   text,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs (created_at desc);
create index audit_logs_entity_idx  on audit_logs (entity_type, entity_id);

-- ---------- contact_messages ----------
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name)    between 2 and 100),
  email      text not null check (char_length(email)   between 5 and 150),
  subject    text not null check (char_length(subject) between 3 and 150),
  message    text not null check (char_length(message) between 10 and 2000),
  status     text not null default 'NEW' check (status in ('NEW','READ')),
  created_at timestamptz not null default now()
);

-- ---------- Append-only protection ----------
create or replace function block_modification()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only: % is not allowed.', tg_table_name, tg_op
    using errcode = '42501';
end $$;

create trigger tracking_events_append_only
  before update or delete on tracking_events
  for each row execute function block_modification();

create trigger audit_logs_append_only
  before update or delete on audit_logs
  for each row execute function block_modification();