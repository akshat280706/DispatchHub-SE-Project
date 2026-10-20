-- =====================================================================
-- DispatchHub 0001: enums, core tables, helpers, signup trigger
-- Run in Supabase Dashboard > SQL Editor. Run each migration once.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role         as enum ('CUSTOMER','DELIVERY_PERSONNEL','BRANCH_MANAGER','ADMIN');
create type parcel_status     as enum ('BOOKED','CONFIRMED','ASSIGNED','PICKED_UP','IN_TRANSIT',
                                       'AT_DESTINATION_BRANCH','OUT_FOR_DELIVERY','DELIVERED',
                                       'DELIVERY_FAILED','RETURNED','CANCELLED');
create type parcel_category   as enum ('DOCUMENT','GENERAL','FRAGILE','ELECTRONICS','CLOTHING','OTHER');
create type rate_zone         as enum ('LOCAL','REGIONAL','NATIONAL');
create type payment_status    as enum ('PENDING','SUCCESS','FAILED','REFUNDED');
create type payment_method    as enum ('ONLINE','DEV_SIMULATED','CASH_ON_PICKUP');
create type assignment_type   as enum ('PICKUP','DELIVERY');
create type assignment_status as enum ('ACTIVE','COMPLETED','REASSIGNED','CANCELLED');
create type complaint_status  as enum ('OPEN','IN_REVIEW','RESOLVED','CLOSED');
create type proof_type        as enum ('PHOTO','SIGNATURE');
create type notification_type as enum ('BOOKING','PAYMENT','ASSIGNMENT','STATUS','DELIVERY','COMPLAINT','SYSTEM');

-- ---------- Generic updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- branches ----------
create table branches (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z0-9]{3,10}$'),
  name        text not null,
  city        text not null,
  state       text not null,
  address     text,
  pincode     text check (pincode is null or pincode ~ '^[0-9]{6}$'),
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index branches_city_idx on branches (city);
create trigger branches_updated_at before update on branches
  for each row execute function set_updated_at();

-- ---------- profiles ----------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text,
  address       text,
  city          text,
  state         text,
  pincode       text check (pincode is null or pincode ~ '^[0-9]{6}$'),
  role          user_role not null default 'CUSTOMER',
  branch_id     uuid references branches(id),
  is_active     boolean not null default true,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- staff must belong to a branch
  constraint profiles_staff_branch_chk check (
    role not in ('BRANCH_MANAGER','DELIVERY_PERSONNEL') or branch_id is not null
  )
);
create index profiles_role_branch_idx on profiles (role, branch_id);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ---------- system_settings ----------
create table system_settings (
  key          text primary key,
  value        jsonb not null,
  description  text,
  is_public    boolean not null default false,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz not null default now()
);

-- ---------- shipping_rates ----------
create table shipping_rates (
  id                 uuid primary key default gen_random_uuid(),
  zone               rate_zone not null,
  category           parcel_category not null,
  base_charge        numeric(10,2) not null check (base_charge >= 0),
  base_weight_kg     numeric(6,2)  not null check (base_weight_kg > 0),
  per_kg_charge      numeric(10,2) not null check (per_kg_charge >= 0),
  handling_surcharge numeric(10,2) not null default 0 check (handling_surcharge >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
-- only one active rate per zone + category
create unique index shipping_rates_active_uq
  on shipping_rates (zone, category) where is_active;
create trigger shipping_rates_updated_at before update on shipping_rates
  for each row execute function set_updated_at();

-- ---------- Helper functions (used by RLS later) ----------
create or replace function current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active
$$;

create or replace function current_branch_id()
returns uuid language sql stable security definer set search_path = public as $$
  select branch_id from profiles where id = auth.uid() and is_active
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'ADMIN' from profiles where id = auth.uid() and is_active), false)
$$;

-- ---------- Signup trigger: ALWAYS creates a CUSTOMER ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  );
  -- role is deliberately NOT read from client metadata
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Block non-admins from changing privileged profile columns ----------
create or replace function protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Allow service role / SQL editor (no JWT user) and admins
  if auth.uid() is null or is_admin() then
    return new;
  end if;
  if new.role        is distinct from old.role
  or new.branch_id   is distinct from old.branch_id
  or new.is_active   is distinct from old.is_active
  or new.email       is distinct from old.email
  or new.id          is distinct from old.id then
    raise exception 'You are not allowed to change role, branch, status or email.'
      using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_protect_columns before update on profiles
  for each row execute function protect_profile_columns();