-- =====================================================================
-- DispatchHub 0003: grants, RLS policies, storage bucket
-- Run once in Supabase SQL Editor, after 0001 and 0002.
-- =====================================================================

-- ---------- Parcel access helpers (SECURITY DEFINER avoids RLS recursion) ----------
create or replace function is_manager_of_parcel(p_parcel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select current_user_role() = 'BRANCH_MANAGER'
     and exists (
       select 1 from parcels
       where id = p_parcel_id
         and (origin_branch_id = current_branch_id()
           or destination_branch_id = current_branch_id())
     )
$$;

create or replace function is_assigned_to_parcel(p_parcel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select current_user_role() = 'DELIVERY_PERSONNEL'
     and exists (
       select 1 from delivery_assignments
       where parcel_id = p_parcel_id
         and personnel_id = auth.uid()
         and status in ('ACTIVE','COMPLETED')
     )
$$;

create or replace function owns_parcel(p_parcel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from parcels where id = p_parcel_id and customer_id = auth.uid())
$$;

create or replace function can_view_parcel(p_parcel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select owns_parcel(p_parcel_id)
      or is_admin()
      or is_manager_of_parcel(p_parcel_id)
      or is_assigned_to_parcel(p_parcel_id)
$$;

-- Active delivery person on a parcel that is out for delivery (used for proof upload)
create or replace function can_upload_proof(p_parcel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select current_user_role() = 'DELIVERY_PERSONNEL'
     and exists (
       select 1
       from delivery_assignments a
       join parcels p on p.id = a.parcel_id
       where a.parcel_id = p_parcel_id
         and a.personnel_id = auth.uid()
         and a.assignment_type = 'DELIVERY'
         and a.status = 'ACTIVE'
         and p.status = 'OUT_FOR_DELIVERY'
     )
$$;

-- Safe text -> uuid cast (returns null instead of raising an error)
create or replace function try_uuid(t text)
returns uuid language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

-- ---------- Complaint number generator ----------
create or replace function set_complaint_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  candidate text;
begin
  loop
    candidate := 'CMP-' || to_char(now(), 'YYMMDD') || '-' ||
                 upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    exit when not exists (select 1 from complaints where complaint_number = candidate);
  end loop;
  new.complaint_number := candidate;   -- always overrides anything the client sent
  return new;
end $$;

create trigger complaints_set_number before insert on complaints
  for each row execute function set_complaint_number();

-- ---------- Enable RLS on every table ----------
alter table profiles               enable row level security;
alter table branches               enable row level security;
alter table system_settings        enable row level security;
alter table shipping_rates         enable row level security;
alter table parcels                enable row level security;
alter table tracking_events        enable row level security;
alter table delivery_assignments   enable row level security;
alter table payments               enable row level security;
alter table delivery_verifications enable row level security;
alter table delivery_proofs        enable row level security;
alter table complaints             enable row level security;
alter table notifications          enable row level security;
alter table audit_logs             enable row level security;
alter table contact_messages       enable row level security;

-- ---------- Explicit table grants ----------
revoke all on all tables in schema public from anon, authenticated;

-- anonymous visitors
grant select on branches, system_settings to anon;
grant insert on contact_messages to anon;

-- signed-in users: read access (RLS decides which rows)
grant select on profiles, branches, system_settings, shipping_rates, parcels,
                tracking_events, delivery_assignments, payments, delivery_proofs,
                complaints, notifications, audit_logs, contact_messages
  to authenticated;

-- direct writes that are allowed (RLS and triggers restrict further)
grant update on profiles to authenticated;                      -- trigger blocks role/branch/status/email edits
grant insert, update on branches, shipping_rates, system_settings to authenticated;  -- admin only via policy
grant insert on complaints to authenticated;                    -- own parcels only via policy
grant insert on contact_messages to authenticated;
grant update (status) on contact_messages to authenticated;     -- admin only via policy
grant update (is_read) on notifications to authenticated;       -- own rows only via policy
-- NOT granted: any write on parcels, tracking_events, delivery_assignments, payments,
-- delivery_verifications, delivery_proofs, audit_logs. These change only through RPC / Edge Functions.
-- delivery_verifications has no grants at all, so clients cannot even read OTP hashes.

-- ---------- profiles ----------
create policy profiles_select_self on profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_manager on profiles for select to authenticated
  using (current_user_role() = 'BRANCH_MANAGER'
         and role = 'DELIVERY_PERSONNEL'
         and branch_id = current_branch_id());
create policy profiles_select_admin on profiles for select to authenticated
  using (is_admin());
create policy profiles_update_self on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on profiles for update to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- branches ----------
create policy branches_read on branches for select to anon, authenticated
  using (is_active or is_admin());
create policy branches_admin_insert on branches for insert to authenticated
  with check (is_admin());
create policy branches_admin_update on branches for update to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- system_settings ----------
create policy settings_read on system_settings for select to anon, authenticated
  using (is_public or is_admin());
create policy settings_admin_insert on system_settings for insert to authenticated
  with check (is_admin());
create policy settings_admin_update on system_settings for update to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- shipping_rates ----------
create policy rates_read on shipping_rates for select to authenticated
  using (is_active or is_admin());
create policy rates_admin_insert on shipping_rates for insert to authenticated
  with check (is_admin());
create policy rates_admin_update on shipping_rates for update to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- parcels (read only) ----------
create policy parcels_select on parcels for select to authenticated
  using (customer_id = auth.uid()
         or is_admin()
         or is_manager_of_parcel(id)
         or is_assigned_to_parcel(id));

-- ---------- tracking_events (read only) ----------
create policy tracking_select on tracking_events for select to authenticated
  using (can_view_parcel(parcel_id));

-- ---------- delivery_assignments (read only) ----------
create policy assignments_select on delivery_assignments for select to authenticated
  using (personnel_id = auth.uid()
         or is_admin()
         or is_manager_of_parcel(parcel_id));

-- ---------- payments (read only) ----------
create policy payments_select on payments for select to authenticated
  using (customer_id = auth.uid()
         or is_admin()
         or is_manager_of_parcel(parcel_id));

-- ---------- delivery_verifications: RLS on, no policies, no grants = fully private ----------

-- ---------- delivery_proofs (read only) ----------
create policy proofs_select on delivery_proofs for select to authenticated
  using (can_view_parcel(parcel_id));

-- ---------- complaints ----------
create policy complaints_select on complaints for select to authenticated
  using (customer_id = auth.uid()
         or is_admin()
         or is_manager_of_parcel(parcel_id));
create policy complaints_insert_own on complaints for insert to authenticated
  with check (customer_id = auth.uid()
              and owns_parcel(parcel_id)
              and status = 'OPEN'
              and handled_by is null
              and resolution_notes is null
              and resolved_at is null);

-- ---------- notifications ----------
create policy notifications_select_own on notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- audit_logs ----------
create policy audit_select_admin on audit_logs for select to authenticated
  using (is_admin());

-- ---------- contact_messages ----------
create policy contact_insert on contact_messages for insert to anon, authenticated
  with check (status = 'NEW');
create policy contact_select_admin on contact_messages for select to authenticated
  using (is_admin());
create policy contact_update_admin on contact_messages for update to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- Storage: private bucket for delivery proofs ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-proofs', 'delivery-proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Path convention: {parcel_id}/{filename}
create policy proofs_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'delivery-proofs'
    and can_upload_proof(try_uuid((storage.foldername(name))[1]))
  );

create policy proofs_storage_select on storage.objects for select to authenticated
  using (
    bucket_id = 'delivery-proofs'
    and can_view_parcel(try_uuid((storage.foldername(name))[1]))
  );
-- No update/delete policies: uploaded proof files cannot be changed or removed by clients.