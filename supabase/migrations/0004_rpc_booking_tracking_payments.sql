-- =====================================================================
-- DispatchHub 0004: internal helpers + booking / tracking / payment RPCs
-- Run once in Supabase SQL Editor, after 0001-0003.
-- =====================================================================

-- ---------- Internal helpers (NOT callable from the browser) ----------
create or replace function get_setting_numeric(p_key text, p_default numeric)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v text;
begin
  select value #>> '{}' into v from system_settings where key = p_key;
  if v is null then return p_default; end if;
  return v::numeric;
exception when others then
  return p_default;
end $$;

create or replace function notify_user(
  p_user uuid, p_type notification_type, p_title text, p_message text, p_parcel uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, type, title, message, parcel_id)
  values (p_user, p_type, p_title, p_message, p_parcel);
$$;

-- clock_timestamp() (not now()) so events in one transaction keep their order
create or replace function add_tracking_event(
  p_parcel uuid, p_status parcel_status, p_branch uuid, p_description text, p_location_note text default null)
returns void language sql security definer set search_path = public as $$
  insert into tracking_events (parcel_id, status, branch_id, description, location_note, created_by, created_at)
  values (p_parcel, p_status, p_branch, p_description, p_location_note, auth.uid(), clock_timestamp());
$$;

create or replace function write_audit(
  p_action text, p_entity_type text, p_entity_id text, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = public as $$
  insert into audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old, p_new);
$$;

create or replace function generate_tracking_number()
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no 0/O/1/I
  suffix text;
  candidate text;
  i int;
begin
  loop
    suffix := '';
    for i in 1..6 loop
      suffix := suffix || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    candidate := 'DH' || to_char(now(), 'YYMMDD') || suffix;
    exit when not exists (select 1 from parcels where tracking_number = candidate);
  end loop;
  return candidate;
end $$;

-- ---------- Shipping quote ----------
create or replace function calculate_shipping_quote(
  p_origin_branch_id uuid,
  p_destination_branch_id uuid,
  p_category parcel_category,
  p_weight_kg numeric,
  p_length_cm numeric default null,
  p_width_cm numeric default null,
  p_height_cm numeric default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  o branches;
  d branches;
  z rate_zone;
  r shipping_rates;
  max_w numeric;
  gst numeric;
  extra_w numeric;
  extra_charge numeric;
  shipping numeric;
  tax numeric;
  days int;
begin
  if auth.uid() is null then
    raise exception 'Please sign in to get a quote.' using errcode = '28000';
  end if;

  select * into o from branches where id = p_origin_branch_id and is_active;
  select * into d from branches where id = p_destination_branch_id and is_active;
  if o.id is null or d.id is null then
    raise exception 'Select valid origin and destination branches.' using errcode = '22023';
  end if;
  if p_category is null then
    raise exception 'Select a parcel category.' using errcode = '22023';
  end if;

  max_w := get_setting_numeric('booking.max_weight_kg', 50);
  if p_weight_kg is null or p_weight_kg <= 0 then
    raise exception 'Weight must be greater than 0 kg.' using errcode = '22023';
  end if;
  if p_weight_kg > max_w then
    raise exception 'Maximum parcel weight is % kg.', max_w using errcode = '22023';
  end if;

  -- Zone comes from branch city/state. No real distance is calculated.
  if lower(trim(o.city)) = lower(trim(d.city)) then
    z := 'LOCAL';
  elsif lower(trim(o.state)) = lower(trim(d.state)) then
    z := 'REGIONAL';
  else
    z := 'NATIONAL';
  end if;

  select * into r from shipping_rates where zone = z and category = p_category and is_active;
  if r.id is null then
    raise exception 'No active rate is configured for % / %.', z, p_category using errcode = '22023';
  end if;

  extra_w      := ceil(greatest(0, p_weight_kg - r.base_weight_kg) * 2) / 2;  -- rounded up to 0.5 kg
  extra_charge := extra_w * r.per_kg_charge;
  shipping     := round(r.base_charge + extra_charge + r.handling_surcharge, 2);
  gst          := get_setting_numeric('tax.gst_percent', 18);
  tax          := round(shipping * gst / 100, 2);
  days         := get_setting_numeric('delivery.estimate_days.' || z::text, 5)::int;

  return jsonb_build_object(
    'zone', z,
    'base_charge', r.base_charge,
    'base_weight_kg', r.base_weight_kg,
    'extra_weight_kg', extra_w,
    'extra_charge', round(extra_charge, 2),
    'handling_surcharge', r.handling_surcharge,
    'shipping_charge', shipping,
    'gst_percent', gst,
    'tax_amount', tax,
    'total_amount', shipping + tax,
    'estimated_days', days,
    'estimated_delivery_date', current_date + days
  );
end $$;

-- ---------- Booking ----------
create or replace function create_parcel_booking(p_payload jsonb, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  existing parcels;
  new_parcel parcels;
  q jsonb;
  v_origin uuid;
  v_dest uuid;
  v_cat parcel_category;
  v_weight numeric;
  v_method payment_method;
  trk text;
begin
  if uid is null or current_user_role() is distinct from 'CUSTOMER' then
    raise exception 'Only customer accounts can book parcels.' using errcode = '42501';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'Missing booking reference. Please reload the form and try again.' using errcode = '22023';
  end if;

  -- Same form submitted twice -> return the first booking instead of creating another
  select * into existing from parcels where customer_id = uid and idempotency_key = p_idempotency_key;
  if existing.id is not null then
    return to_jsonb(existing);
  end if;

  if coalesce(trim(p_payload->>'sender_name'), '') = ''
     or coalesce(trim(p_payload->>'pickup_address'), '') = ''
     or coalesce(trim(p_payload->>'receiver_name'), '') = ''
     or coalesce(trim(p_payload->>'delivery_address'), '') = ''
     or coalesce(trim(p_payload->>'delivery_city'), '') = '' then
    raise exception 'Sender, receiver and address details are required.' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'sender_phone', '') !~ '^[+]?[0-9]{10,13}$'
     or coalesce(p_payload->>'receiver_phone', '') !~ '^[+]?[0-9]{10,13}$' then
    raise exception 'Enter valid phone numbers (10 to 13 digits).' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'delivery_pincode', '') !~ '^[0-9]{6}$' then
    raise exception 'Delivery pincode must be 6 digits.' using errcode = '22023';
  end if;

  v_origin := (p_payload->>'origin_branch_id')::uuid;
  v_dest   := (p_payload->>'destination_branch_id')::uuid;
  v_cat    := (p_payload->>'category')::parcel_category;
  v_weight := (p_payload->>'weight_kg')::numeric;
  v_method := coalesce(nullif(p_payload->>'payment_method', ''), 'DEV_SIMULATED')::payment_method;

  q := calculate_shipping_quote(
         v_origin, v_dest, v_cat, v_weight,
         nullif(p_payload->>'length_cm', '')::numeric,
         nullif(p_payload->>'width_cm', '')::numeric,
         nullif(p_payload->>'height_cm', '')::numeric);

  trk := generate_tracking_number();

  insert into parcels (
    tracking_number, customer_id, origin_branch_id, destination_branch_id,
    sender_name, sender_phone, pickup_address,
    receiver_name, receiver_phone, delivery_address, delivery_city, delivery_pincode,
    category, weight_kg, length_cm, width_cm, height_cm, description, special_instructions,
    zone, shipping_charge, tax_amount, total_amount, estimated_delivery_date, idempotency_key)
  values (
    trk, uid, v_origin, v_dest,
    trim(p_payload->>'sender_name'), trim(p_payload->>'sender_phone'), trim(p_payload->>'pickup_address'),
    trim(p_payload->>'receiver_name'), trim(p_payload->>'receiver_phone'),
    trim(p_payload->>'delivery_address'), trim(p_payload->>'delivery_city'), trim(p_payload->>'delivery_pincode'),
    v_cat, v_weight,
    nullif(p_payload->>'length_cm', '')::numeric,
    nullif(p_payload->>'width_cm', '')::numeric,
    nullif(p_payload->>'height_cm', '')::numeric,
    nullif(trim(p_payload->>'description'), ''),
    nullif(trim(p_payload->>'special_instructions'), ''),
    (q->>'zone')::rate_zone,
    (q->>'shipping_charge')::numeric,
    (q->>'tax_amount')::numeric,
    (q->>'total_amount')::numeric,
    (q->>'estimated_delivery_date')::date,
    trim(p_idempotency_key))
  returning * into new_parcel;

  perform add_tracking_event(new_parcel.id, 'BOOKED', v_origin, 'Booking created');

  insert into payments (parcel_id, customer_id, amount, method, status)
  values (new_parcel.id, uid, new_parcel.total_amount, v_method, 'PENDING');

  -- Business rule: cash on pickup is confirmed immediately
  if v_method = 'CASH_ON_PICKUP' then
    update parcels set status = 'CONFIRMED' where id = new_parcel.id returning * into new_parcel;
    perform add_tracking_event(new_parcel.id, 'CONFIRMED', v_origin, 'Booking confirmed (cash on pickup)');
  end if;

  perform notify_user(uid, 'BOOKING', 'Booking received',
    'Your parcel ' || trk || ' has been booked.', new_parcel.id);

  return to_jsonb(new_parcel);

exception
  when unique_violation then
    select * into existing from parcels where customer_id = uid and idempotency_key = p_idempotency_key;
    if existing.id is not null then
      return to_jsonb(existing);
    end if;
    raise;
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'One or more booking values are invalid.' using errcode = '22023';
end $$;

-- ---------- Cancellation ----------
create or replace function cancel_parcel(p_parcel_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  role_now user_role := current_user_role();
  p parcels;
  old_status parcel_status;
  is_owner boolean;
  is_staff boolean;
  refunded boolean := false;
begin
  if uid is null or role_now is null then
    raise exception 'Please sign in.' using errcode = '28000';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A cancellation reason is required.' using errcode = '22023';
  end if;

  select * into p from parcels where id = p_parcel_id for update;   -- lock row
  is_owner := (p.id is not null and p.customer_id = uid);
  is_staff := (p.id is not null and (role_now = 'ADMIN' or is_manager_of_parcel(p_parcel_id)));
  if p.id is null or not (is_owner or is_staff) then
    raise exception 'Parcel not found or you do not have access to it.' using errcode = '42501';
  end if;

  if is_owner and not is_staff and p.status not in ('BOOKED','CONFIRMED') then
    raise exception 'You can cancel a parcel only before pickup is assigned. Please contact support.'
      using errcode = '22023';
  end if;
  if p.status not in ('BOOKED','CONFIRMED','ASSIGNED') then
    raise exception 'This parcel cannot be cancelled (current status: %).', p.status
      using errcode = '22023';
  end if;

  old_status := p.status;

  -- tell the pickup person first, then close their assignment
  perform notify_user(a.personnel_id, 'ASSIGNMENT', 'Assignment cancelled',
    'Parcel ' || p.tracking_number || ' was cancelled.', p.id)
  from delivery_assignments a
  where a.parcel_id = p.id and a.status = 'ACTIVE';

  update delivery_assignments set status = 'CANCELLED', completed_at = now()
  where parcel_id = p.id and status = 'ACTIVE';

  update parcels set status = 'CANCELLED', cancelled_reason = trim(p_reason) where id = p.id;

  -- Payment records only. No real money moves in development mode.
  update payments set status = 'REFUNDED' where parcel_id = p.id and status = 'SUCCESS';
  refunded := found;
  update payments set status = 'FAILED', failure_reason = 'Parcel cancelled'
  where parcel_id = p.id and status = 'PENDING';

  perform add_tracking_event(p.id, 'CANCELLED', p.origin_branch_id, 'Parcel cancelled');

  perform notify_user(p.customer_id, 'STATUS', 'Booking cancelled',
    'Parcel ' || p.tracking_number || ' was cancelled.' ||
    case when refunded then ' Your payment is marked as refunded (record only; no real money is moved in development mode).' else '' end,
    p.id);

  perform write_audit('PARCEL_CANCELLED', 'parcel', p.id::text,
    jsonb_build_object('status', old_status),
    jsonb_build_object('status', 'CANCELLED', 'reason', trim(p_reason)));

  return jsonb_build_object('id', p.id, 'status', 'CANCELLED');
end $$;

-- ---------- Public tracking (no table access needed) ----------
create or replace function track_parcel(p_tracking_number text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  p parcels;
  o branches;
  d branches;
  events jsonb;
begin
  if p_tracking_number is null
     or length(trim(p_tracking_number)) < 6
     or length(trim(p_tracking_number)) > 30 then
    return null;
  end if;

  select * into p from parcels where tracking_number = upper(trim(p_tracking_number));
  if p.id is null then
    return null;
  end if;

  select * into o from branches where id = p.origin_branch_id;
  select * into d from branches where id = p.destination_branch_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'status', e.status,
           'occurred_at', e.created_at,
           'branch_city', b.city,
           'description', e.description) order by e.created_at, e.id), '[]'::jsonb)
    into events
  from tracking_events e
  left join branches b on b.id = e.branch_id
  where e.parcel_id = p.id;

  -- Deliberately excludes: names, phones, street addresses, payment data, proofs, user ids, internal notes
  return jsonb_build_object(
    'tracking_number', p.tracking_number,
    'status', p.status,
    'booked_at', p.created_at,
    'origin', jsonb_build_object('city', o.city, 'branch_name', o.name),
    'destination', jsonb_build_object('city', d.city, 'branch_name', d.name),
    'estimated_delivery_date',
      case when p.status in ('DELIVERED','RETURNED','CANCELLED') then null else p.estimated_delivery_date end,
    'events', events
  );
end $$;

-- ---------- Payment result (server-side only) ----------
create or replace function apply_payment_result(
  p_payment_id uuid,
  p_status payment_status,
  p_provider text,
  p_transaction_reference text,
  p_failure_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pay payments;
  par parcels;
  is_dev boolean := (p_provider = 'dev');
begin
  if p_status not in ('SUCCESS','FAILED') then
    raise exception 'Only SUCCESS or FAILED results can be applied.' using errcode = '22023';
  end if;

  select * into pay from payments where id = p_payment_id for update;
  if pay.id is null then
    raise exception 'Payment not found.' using errcode = 'P0002';
  end if;

  -- Idempotent: repeated callbacks for a successful payment change nothing
  if pay.status = 'SUCCESS' then
    return jsonb_build_object('payment_id', pay.id, 'status', 'SUCCESS', 'already_processed', true);
  end if;
  if pay.status = 'REFUNDED' then
    raise exception 'This payment was refunded and cannot be updated.' using errcode = '22023';
  end if;

  select * into par from parcels where id = pay.parcel_id for update;

  if p_status = 'SUCCESS' then
    if par.status = 'CANCELLED' then
      raise exception 'Cannot apply a payment to a cancelled parcel.' using errcode = '22023';
    end if;
    if p_transaction_reference is null or length(trim(p_transaction_reference)) = 0 then
      raise exception 'A transaction reference is required for a successful payment.' using errcode = '22023';
    end if;

    update payments
       set status = 'SUCCESS', provider = p_provider, transaction_reference = trim(p_transaction_reference),
           paid_at = now(), failure_reason = null
     where id = pay.id;

    if par.status = 'BOOKED' then
      update parcels set status = 'CONFIRMED' where id = par.id;
      perform add_tracking_event(par.id, 'CONFIRMED', par.origin_branch_id, 'Payment received. Booking confirmed');
    end if;

    perform notify_user(pay.customer_id, 'PAYMENT', 'Payment successful',
      'Payment for parcel ' || par.tracking_number || ' was successful.' ||
      case when is_dev then ' (Development payment: no real money was processed.)' else '' end,
      par.id);
  else
    update payments
       set status = 'FAILED', provider = p_provider,
           failure_reason = coalesce(nullif(trim(p_failure_reason), ''), 'Payment failed')
     where id = pay.id;

    perform notify_user(pay.customer_id, 'PAYMENT', 'Payment failed',
      'Payment for parcel ' || par.tracking_number || ' did not go through. You can try again from the booking page.',
      par.id);
  end if;

  return jsonb_build_object('payment_id', pay.id, 'status', p_status, 'already_processed', false);
end $$;

-- ---------- Function permissions (explicit) ----------
-- Internal helpers: nobody from the browser
revoke execute on function get_setting_numeric(text, numeric)                                  from public, anon, authenticated;
revoke execute on function notify_user(uuid, notification_type, text, text, uuid)              from public, anon, authenticated;
revoke execute on function add_tracking_event(uuid, parcel_status, uuid, text, text)           from public, anon, authenticated;
revoke execute on function write_audit(text, text, text, jsonb, jsonb)                         from public, anon, authenticated;
revoke execute on function generate_tracking_number()                                          from public, anon, authenticated;

-- Server-side only (Edge Functions with the service role)
revoke execute on function apply_payment_result(uuid, payment_status, text, text, text)        from public, anon, authenticated;
grant  execute on function apply_payment_result(uuid, payment_status, text, text, text)        to service_role;

-- Signed-in users
revoke execute on function calculate_shipping_quote(uuid, uuid, parcel_category, numeric, numeric, numeric, numeric) from public, anon;
grant  execute on function calculate_shipping_quote(uuid, uuid, parcel_category, numeric, numeric, numeric, numeric) to authenticated;
revoke execute on function create_parcel_booking(jsonb, text) from public, anon;
grant  execute on function create_parcel_booking(jsonb, text) to authenticated;
revoke execute on function cancel_parcel(uuid, text)          from public, anon;
grant  execute on function cancel_parcel(uuid, text)          to authenticated;

-- Public tracking
revoke execute on function track_parcel(text) from public;
grant  execute on function track_parcel(text) to anon, authenticated;