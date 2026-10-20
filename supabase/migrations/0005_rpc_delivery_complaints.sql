-- =====================================================================
-- DispatchHub 0005: assignment, status, OTP, delivery verification, complaints
-- Run once in Supabase SQL Editor, after 0001-0004.
-- =====================================================================

-- Dev-mode OTP: plaintext is stored ONLY while dev.show_delivery_otp = true.
-- delivery_verifications has no client grants, so browsers can never read this column.
alter table delivery_verifications add column if not exists dev_otp text;

-- ---------- Internal helpers ----------
create or replace function get_setting_bool(p_key text, p_default boolean)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v text;
begin
  select value #>> '{}' into v from system_settings where key = p_key;
  if v is null then return p_default; end if;
  return lower(v) = 'true';
end $$;

create or replace function notify_branch_managers(
  p_branch uuid, p_type notification_type, p_title text, p_message text, p_parcel uuid)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, type, title, message, parcel_id)
  select id, p_type, p_title, p_message, p_parcel
  from profiles
  where role = 'BRANCH_MANAGER' and branch_id = p_branch and is_active;
$$;

-- ---------- Assign / reassign ----------
create or replace function assign_parcel(
  p_parcel_id uuid, p_personnel_id uuid, p_type assignment_type, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  role_now user_role := current_user_role();
  p parcels;
  person profiles;
  required_branch uuid;
  old_a delivery_assignments;
  new_a delivery_assignments;
begin
  if uid is null or role_now is null or role_now not in ('BRANCH_MANAGER','ADMIN') then
    raise exception 'Only branch managers and admins can assign parcels.' using errcode = '42501';
  end if;

  select * into p from parcels where id = p_parcel_id for update;   -- lock the parcel
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;

  required_branch := case p_type when 'PICKUP' then p.origin_branch_id else p.destination_branch_id end;
  if role_now = 'BRANCH_MANAGER' and current_branch_id() is distinct from required_branch then
    raise exception 'Only the % branch manager can make this assignment.',
      case p_type when 'PICKUP' then 'origin' else 'destination' end using errcode = '42501';
  end if;

  if p_type = 'PICKUP' and p.status not in ('CONFIRMED','ASSIGNED') then
    raise exception 'Pickup can be assigned only for CONFIRMED parcels (current status: %).', p.status
      using errcode = '22023';
  end if;
  if p_type = 'DELIVERY' and p.status not in ('AT_DESTINATION_BRANCH','OUT_FOR_DELIVERY','DELIVERY_FAILED') then
    raise exception 'Delivery can be assigned only after the parcel reaches the destination branch (current status: %).', p.status
      using errcode = '22023';
  end if;

  select * into person from profiles where id = p_personnel_id;
  if person.id is null or person.role <> 'DELIVERY_PERSONNEL' or not person.is_active then
    raise exception 'Select an active delivery person.' using errcode = '22023';
  end if;
  if person.branch_id is distinct from required_branch then
    raise exception 'The delivery person must belong to the % branch.',
      case p_type when 'PICKUP' then 'origin' else 'destination' end using errcode = '22023';
  end if;
  if not person.is_available then
    raise exception '% is currently marked unavailable.', person.full_name using errcode = '22023';
  end if;

  select * into old_a from delivery_assignments
   where parcel_id = p.id and assignment_type = p_type and status = 'ACTIVE' for update;
  if old_a.id is not null then
    if old_a.personnel_id = p_personnel_id then
      raise exception 'This parcel is already assigned to that person.' using errcode = '22023';
    end if;
    if p_reason is null or length(trim(p_reason)) < 3 then
      raise exception 'A reassignment reason is required.' using errcode = '22023';
    end if;
    update delivery_assignments
       set status = 'REASSIGNED', reassign_reason = trim(p_reason), completed_at = now()
     where id = old_a.id;
    perform notify_user(old_a.personnel_id, 'ASSIGNMENT', 'Assignment removed',
      'Parcel ' || p.tracking_number || ' was reassigned to someone else.', p.id);
  end if;

  insert into delivery_assignments (parcel_id, personnel_id, assigned_by, assignment_type)
  values (p.id, p_personnel_id, uid, p_type)
  returning * into new_a;

  if p_type = 'PICKUP' and p.status = 'CONFIRMED' then
    update parcels set status = 'ASSIGNED' where id = p.id;
    perform add_tracking_event(p.id, 'ASSIGNED', p.origin_branch_id, 'Pickup assigned');
    perform notify_user(p.customer_id, 'STATUS', 'Pickup scheduled',
      'A delivery partner has been assigned to pick up parcel ' || p.tracking_number || '.', p.id);
  end if;

  perform notify_user(p_personnel_id, 'ASSIGNMENT', 'New assignment',
    'You have a new ' || lower(p_type::text) || ' assignment: parcel ' || p.tracking_number || '.', p.id);

  perform write_audit(
    case when old_a.id is null then 'PARCEL_ASSIGNED' else 'PARCEL_REASSIGNED' end,
    'parcel', p.id::text,
    case when old_a.id is null then null else jsonb_build_object('personnel_id', old_a.personnel_id) end,
    jsonb_build_object('personnel_id', p_personnel_id, 'type', p_type, 'reason', nullif(trim(p_reason), '')));

  return to_jsonb(new_a);

exception when unique_violation then
  raise exception 'This parcel was just assigned by someone else. Refresh and try again.' using errcode = '40001';
end $$;

-- ---------- Validated status updates (pickup, dispatch, arrival, return) ----------
create or replace function update_parcel_status(
  p_parcel_id uuid, p_new_status parcel_status, p_note text default null, p_location_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  role_now user_role := current_user_role();
  p parcels;
  is_admin_user boolean;
  is_origin_mgr boolean;
  is_dest_mgr boolean;
  is_pickup_person boolean;
  v_desc text;
  v_branch uuid;
begin
  if uid is null or role_now is null
     or role_now not in ('BRANCH_MANAGER','DELIVERY_PERSONNEL','ADMIN') then
    raise exception 'You are not allowed to update parcel status.' using errcode = '42501';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;

  is_admin_user := (role_now = 'ADMIN');
  is_origin_mgr := (role_now = 'BRANCH_MANAGER' and current_branch_id() = p.origin_branch_id);
  is_dest_mgr   := (role_now = 'BRANCH_MANAGER' and current_branch_id() = p.destination_branch_id);
  is_pickup_person := (role_now = 'DELIVERY_PERSONNEL' and exists (
    select 1 from delivery_assignments
    where parcel_id = p.id and personnel_id = uid
      and assignment_type = 'PICKUP' and status = 'ACTIVE'));

  if p_new_status = 'DELIVERED' then
    raise exception 'Delivery can only be completed through OTP verification.' using errcode = '22023';

  elsif p.status = 'ASSIGNED' and p_new_status = 'PICKED_UP' then
    if not (is_pickup_person or is_admin_user) then
      raise exception 'Only the assigned pickup person can mark this parcel as picked up.' using errcode = '42501';
    end if;
    v_desc := 'Parcel picked up'; v_branch := p.origin_branch_id;
    update delivery_assignments set status = 'COMPLETED', completed_at = now()
     where parcel_id = p.id and assignment_type = 'PICKUP' and status = 'ACTIVE';

  elsif p.status = 'PICKED_UP' and p_new_status = 'IN_TRANSIT' then
    if not (is_origin_mgr or is_admin_user) then
      raise exception 'Only the origin branch manager can dispatch this parcel.' using errcode = '42501';
    end if;
    v_desc := 'Parcel dispatched from origin branch'; v_branch := p.origin_branch_id;

  elsif p.status = 'IN_TRANSIT' and p_new_status = 'AT_DESTINATION_BRANCH' then
    if not (is_dest_mgr or is_admin_user) then
      raise exception 'Only the destination branch manager can confirm arrival.' using errcode = '42501';
    end if;
    v_desc := 'Parcel arrived at destination branch'; v_branch := p.destination_branch_id;

  elsif p.status = 'DELIVERY_FAILED' and p_new_status = 'RETURNED' then
    if not (is_dest_mgr or is_admin_user) then
      raise exception 'Only the destination branch manager can return this parcel.' using errcode = '42501';
    end if;
    if p_note is null or length(trim(p_note)) < 3 then
      raise exception 'A note is required when returning a parcel.' using errcode = '22023';
    end if;
    v_desc := 'Parcel returned to sender'; v_branch := p.destination_branch_id;
    update delivery_assignments set status = 'COMPLETED', completed_at = now()
     where parcel_id = p.id and status = 'ACTIVE';

  elsif p_new_status in ('CONFIRMED','ASSIGNED','OUT_FOR_DELIVERY','DELIVERY_FAILED','CANCELLED') then
    raise exception 'Use the dedicated action for this change (payment, assignment, start delivery, delivery failure or cancel).'
      using errcode = '22023';
  else
    raise exception 'Status change from % to % is not allowed.', p.status, p_new_status using errcode = '22023';
  end if;

  update parcels set status = p_new_status where id = p.id;
  -- Staff notes go into location_note, which public tracking never returns
  perform add_tracking_event(p.id, p_new_status, v_branch, v_desc,
    nullif(trim(concat_ws(' | ', p_location_note, p_note)), ''));
  perform notify_user(p.customer_id, 'STATUS', 'Parcel update',
    'Parcel ' || p.tracking_number || ': ' || v_desc || '.', p.id);

  return jsonb_build_object('id', p.id, 'status', p_new_status);
end $$;

-- ---------- Start delivery (creates the OTP) ----------
create or replace function start_delivery(p_parcel_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  p parcels;
  b bytea;
  v_otp text;
  expiry numeric;
  max_att numeric;
  dev boolean;
begin
  if uid is null or current_user_role() is distinct from 'DELIVERY_PERSONNEL' then
    raise exception 'Only delivery personnel can start a delivery.' using errcode = '42501';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;
  if not exists (
       select 1 from delivery_assignments
       where parcel_id = p.id and personnel_id = uid
         and assignment_type = 'DELIVERY' and status = 'ACTIVE') then
    raise exception 'You are not assigned to deliver this parcel.' using errcode = '42501';
  end if;
  if p.status not in ('AT_DESTINATION_BRANCH','DELIVERY_FAILED') then
    raise exception 'Delivery can start only from the destination branch or after a failed attempt (current status: %).', p.status
      using errcode = '22023';
  end if;

  expiry  := get_setting_numeric('delivery.otp_expiry_hours', 24);
  max_att := get_setting_numeric('delivery.otp_max_attempts', 5);
  dev     := get_setting_bool('dev.show_delivery_otp', true);

  b := gen_random_bytes(4);
  v_otp := lpad(((get_byte(b,0)::bigint * 16777216 + get_byte(b,1) * 65536
                 + get_byte(b,2) * 256 + get_byte(b,3)) % 1000000)::text, 6, '0');

  update delivery_verifications set is_active = false where parcel_id = p.id and is_active;
  insert into delivery_verifications (parcel_id, otp_hash, expires_at, max_attempts, is_dev_mode, dev_otp)
  values (p.id, crypt(v_otp, gen_salt('bf')), now() + make_interval(hours => expiry::int),
          max_att::int, dev, case when dev then v_otp else null end);

  update parcels set status = 'OUT_FOR_DELIVERY' where id = p.id;
  perform add_tracking_event(p.id, 'OUT_FOR_DELIVERY', p.destination_branch_id, 'Out for delivery');

  perform notify_user(p.customer_id, 'DELIVERY', 'Out for delivery',
    'Parcel ' || p.tracking_number || ' is out for delivery.' ||
    case when dev then ' Development mode: your delivery code is shown on the parcel page. No SMS or email was sent.' else '' end,
    p.id);

  return jsonb_build_object('id', p.id, 'status', 'OUT_FOR_DELIVERY', 'dev_mode', dev);
end $$;

-- ---------- Customer reads the development OTP ----------
create or replace function get_dev_delivery_otp(p_parcel_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v delivery_verifications;
begin
  if auth.uid() is null or not owns_parcel(p_parcel_id) then
    return null;
  end if;
  if not get_setting_bool('dev.show_delivery_otp', true) then
    return null;
  end if;

  select * into v from delivery_verifications
   where parcel_id = p_parcel_id and is_active and dev_otp is not null and expires_at > now();
  if v.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'otp', v.dev_otp,
    'expires_at', v.expires_at,
    'attempts_left', greatest(0, v.max_attempts - v.attempts),
    'notice', 'Development OTP: no SMS or email was sent.');
end $$;

-- ---------- Register an uploaded proof file ----------
create or replace function register_delivery_proof(
  p_parcel_id uuid, p_storage_path text, p_proof_type proof_type default 'PHOTO')
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null or not can_upload_proof(p_parcel_id) then
    raise exception 'You cannot add proof to this parcel.' using errcode = '42501';
  end if;
  if p_storage_path is null or p_storage_path not like (p_parcel_id::text || '/%') then
    raise exception 'Invalid file path.' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'delivery-proofs' and name = p_storage_path) then
    raise exception 'File not found in storage. Upload it first.' using errcode = '22023';
  end if;

  insert into delivery_proofs (parcel_id, uploaded_by, proof_type, storage_path)
  values (p_parcel_id, auth.uid(), p_proof_type, p_storage_path)
  returning id into new_id;
  return new_id;
end $$;

-- ---------- Verify delivery (the ONLY path to DELIVERED) ----------
-- A wrong code RETURNS {verified:false}, it does not raise,
-- because raising would roll back the attempt counter.
create or replace function verify_delivery(p_parcel_id uuid, p_otp text, p_proof_ids uuid[] default '{}')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  p parcels;
  v delivery_verifications;
  need_photo boolean;
  proof_count int;
begin
  if uid is null or current_user_role() is distinct from 'DELIVERY_PERSONNEL' then
    raise exception 'Only delivery personnel can verify a delivery.' using errcode = '42501';
  end if;
  if p_otp is null or p_otp !~ '^[0-9]{6}$' then
    raise exception 'Enter the 6-digit delivery code.' using errcode = '22023';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;
  if not exists (
       select 1 from delivery_assignments
       where parcel_id = p.id and personnel_id = uid
         and assignment_type = 'DELIVERY' and status = 'ACTIVE') then
    raise exception 'You are not assigned to deliver this parcel.' using errcode = '42501';
  end if;
  if p.status <> 'OUT_FOR_DELIVERY' then
    raise exception 'This parcel is not out for delivery (current status: %).', p.status using errcode = '22023';
  end if;

  need_photo := get_setting_bool('delivery.require_photo', true);
  select count(*) into proof_count from delivery_proofs
   where parcel_id = p.id and uploaded_by = uid and id = any(coalesce(p_proof_ids, '{}'));
  if need_photo and proof_count = 0 then
    raise exception 'Upload a delivery photo before verifying.' using errcode = '22023';
  end if;

  select * into v from delivery_verifications where parcel_id = p.id and is_active for update;
  if v.id is null then
    raise exception 'No active delivery code. Start the delivery again.' using errcode = '22023';
  end if;
  if v.expires_at <= now() then
    raise exception 'The delivery code has expired. Record a failed attempt, then start delivery again.' using errcode = '22023';
  end if;
  if v.attempts >= v.max_attempts then
    raise exception 'Too many wrong codes. Record a failed attempt, then start delivery again.' using errcode = '22023';
  end if;

  if crypt(p_otp, v.otp_hash) <> v.otp_hash then
    update delivery_verifications set attempts = attempts + 1 where id = v.id;
    return jsonb_build_object('verified', false,
                              'attempts_left', greatest(0, v.max_attempts - v.attempts - 1));
  end if;

  update delivery_verifications
     set verified_at = now(), verified_by = uid, is_active = false, dev_otp = null
   where id = v.id;
  update delivery_assignments set status = 'COMPLETED', completed_at = now()
   where parcel_id = p.id and assignment_type = 'DELIVERY' and status = 'ACTIVE';
  update parcels set status = 'DELIVERED', delivered_at = now() where id = p.id;

  perform add_tracking_event(p.id, 'DELIVERED', p.destination_branch_id, 'Parcel delivered');
  perform notify_user(p.customer_id, 'DELIVERY', 'Parcel delivered',
    'Parcel ' || p.tracking_number || ' has been delivered.', p.id);
  perform notify_branch_managers(p.destination_branch_id, 'DELIVERY', 'Parcel delivered',
    'Parcel ' || p.tracking_number || ' was delivered.', p.id);

  return jsonb_build_object('verified', true, 'status', 'DELIVERED');
end $$;

-- ---------- Record a failed delivery attempt ----------
create or replace function record_delivery_failure(p_parcel_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  p parcels;
begin
  if uid is null or current_user_role() is distinct from 'DELIVERY_PERSONNEL' then
    raise exception 'Only delivery personnel can record a failed delivery.' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A reason is required.' using errcode = '22023';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;
  if not exists (
       select 1 from delivery_assignments
       where parcel_id = p.id and personnel_id = uid
         and assignment_type = 'DELIVERY' and status = 'ACTIVE') then
    raise exception 'You are not assigned to deliver this parcel.' using errcode = '42501';
  end if;
  if p.status <> 'OUT_FOR_DELIVERY' then
    raise exception 'Only parcels that are out for delivery can be marked as failed (current status: %).', p.status
      using errcode = '22023';
  end if;

  update delivery_verifications set is_active = false, dev_otp = null where parcel_id = p.id and is_active;
  update parcels set status = 'DELIVERY_FAILED' where id = p.id;

  perform add_tracking_event(p.id, 'DELIVERY_FAILED', p.destination_branch_id,
    'Delivery attempt unsuccessful', trim(p_reason));
  perform notify_user(p.customer_id, 'DELIVERY', 'Delivery attempt unsuccessful',
    'We could not deliver parcel ' || p.tracking_number || '. Another attempt will be arranged.', p.id);
  perform notify_branch_managers(p.destination_branch_id, 'DELIVERY', 'Delivery failed',
    'Delivery failed for parcel ' || p.tracking_number || ': ' || trim(p_reason), p.id);

  return jsonb_build_object('id', p.id, 'status', 'DELIVERY_FAILED');
end $$;

-- ---------- Complaint lifecycle ----------
create or replace function update_complaint(p_complaint_id uuid, p_status complaint_status, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  role_now user_role := current_user_role();
  c complaints;
  valid boolean;
begin
  if uid is null or role_now is null or role_now not in ('BRANCH_MANAGER','ADMIN') then
    raise exception 'Only managers and admins can update complaints.' using errcode = '42501';
  end if;

  select * into c from complaints where id = p_complaint_id for update;
  if c.id is null or not (role_now = 'ADMIN' or is_manager_of_parcel(c.parcel_id)) then
    raise exception 'Complaint not found or you do not have access to it.' using errcode = '42501';
  end if;

  valid := (c.status = 'OPEN'      and p_status = 'IN_REVIEW')
        or (c.status = 'IN_REVIEW' and p_status = 'RESOLVED')
        or (c.status = 'RESOLVED'  and p_status in ('CLOSED','IN_REVIEW'));
  if not valid then
    raise exception 'A complaint cannot move from % to %.', c.status, p_status using errcode = '22023';
  end if;
  if p_status = 'RESOLVED' and coalesce(nullif(trim(p_notes), ''), c.resolution_notes) is null then
    raise exception 'Resolution notes are required to resolve a complaint.' using errcode = '22023';
  end if;

  update complaints
     set status = p_status,
         resolution_notes = coalesce(nullif(trim(p_notes), ''), resolution_notes),
         handled_by = uid,
         resolved_at = case when p_status = 'RESOLVED' then now()
                            when p_status = 'IN_REVIEW' then null
                            else resolved_at end
   where id = c.id;

  perform notify_user(c.customer_id, 'COMPLAINT', 'Complaint update',
    'Your complaint ' || c.complaint_number || ' is now ' || replace(p_status::text, '_', ' ') || '.' ||
    case when p_status = 'RESOLVED' and nullif(trim(p_notes), '') is not null
         then ' Resolution: ' || trim(p_notes) else '' end,
    c.parcel_id);

  perform write_audit('COMPLAINT_' || p_status::text, 'complaint', c.id::text,
    jsonb_build_object('status', c.status), jsonb_build_object('status', p_status));

  return jsonb_build_object('id', c.id, 'status', p_status);
end $$;

-- ---------- Function permissions ----------
revoke execute on function get_setting_bool(text, boolean) from public, anon, authenticated;
revoke execute on function notify_branch_managers(uuid, notification_type, text, text, uuid) from public, anon, authenticated;

revoke execute on function assign_parcel(uuid, uuid, assignment_type, text)              from public, anon;
grant  execute on function assign_parcel(uuid, uuid, assignment_type, text)              to authenticated;
revoke execute on function update_parcel_status(uuid, parcel_status, text, text)         from public, anon;
grant  execute on function update_parcel_status(uuid, parcel_status, text, text)         to authenticated;
revoke execute on function start_delivery(uuid)                                          from public, anon;
grant  execute on function start_delivery(uuid)                                          to authenticated;
revoke execute on function get_dev_delivery_otp(uuid)                                    from public, anon;
grant  execute on function get_dev_delivery_otp(uuid)                                    to authenticated;
revoke execute on function register_delivery_proof(uuid, text, proof_type)               from public, anon;
grant  execute on function register_delivery_proof(uuid, text, proof_type)               to authenticated;
revoke execute on function verify_delivery(uuid, text, uuid[])                           from public, anon;
grant  execute on function verify_delivery(uuid, text, uuid[])                           to authenticated;
revoke execute on function record_delivery_failure(uuid, text)                           from public, anon;
grant  execute on function record_delivery_failure(uuid, text)                           to authenticated;
revoke execute on function update_complaint(uuid, complaint_status, text)                from public, anon;
grant  execute on function update_complaint(uuid, complaint_status, text)                to authenticated;