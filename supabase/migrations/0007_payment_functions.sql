-- =====================================================================
-- DispatchHub 0007: payment retry + cash collection
-- Run once in Supabase SQL Editor, after 0001-0006.
-- =====================================================================

-- Customer: get (or create) the pending development payment for a BOOKED parcel
create or replace function create_payment_attempt(p_parcel_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  p parcels;
  existing_id uuid;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Please sign in.' using errcode = '28000';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null or p.customer_id <> uid then
    raise exception 'Parcel not found or you do not have access to it.' using errcode = '42501';
  end if;
  if p.status <> 'BOOKED' then
    raise exception 'Payment is only needed for booked parcels (current status: %).', p.status using errcode = '22023';
  end if;
  if exists (select 1 from payments where parcel_id = p.id and status = 'SUCCESS') then
    raise exception 'This parcel is already paid.' using errcode = '22023';
  end if;

  select id into existing_id from payments
   where parcel_id = p.id and status = 'PENDING' and method = 'DEV_SIMULATED'
   order by created_at desc limit 1;
  if existing_id is not null then
    return existing_id;
  end if;

  insert into payments (parcel_id, customer_id, amount, method, status)
  values (p.id, uid, p.total_amount, 'DEV_SIMULATED', 'PENDING')
  returning id into new_id;
  return new_id;
end $$;

-- Pickup rider (assigned), origin branch manager or admin: record that cash was collected
create or replace function mark_cash_collected(p_parcel_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  role_now user_role := current_user_role();
  p parcels;
  pay payments;
  allowed boolean;
  ref text;
begin
  if uid is null or role_now is null or role_now not in ('DELIVERY_PERSONNEL','BRANCH_MANAGER','ADMIN') then
    raise exception 'You are not allowed to record cash payments.' using errcode = '42501';
  end if;

  select * into p from parcels where id = p_parcel_id for update;
  if p.id is null then
    raise exception 'Parcel not found.' using errcode = 'P0002';
  end if;

  allowed := role_now = 'ADMIN'
    or (role_now = 'BRANCH_MANAGER' and current_branch_id() = p.origin_branch_id)
    or (role_now = 'DELIVERY_PERSONNEL' and exists (
          select 1 from delivery_assignments
           where parcel_id = p.id and personnel_id = uid
             and assignment_type = 'PICKUP' and status in ('ACTIVE','COMPLETED')));
  if not allowed then
    raise exception 'Only the pickup partner or the origin branch can record this payment.' using errcode = '42501';
  end if;
  if p.status = 'CANCELLED' then
    raise exception 'This parcel was cancelled.' using errcode = '22023';
  end if;

  select * into pay from payments
   where parcel_id = p.id and method = 'CASH_ON_PICKUP' and status = 'PENDING'
   order by created_at desc limit 1 for update;
  if pay.id is null then
    raise exception 'There is no pending cash payment for this parcel.' using errcode = '22023';
  end if;

  ref := 'CASH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  update payments
     set status = 'SUCCESS', provider = 'cash', transaction_reference = ref, paid_at = now()
   where id = pay.id;

  perform notify_user(p.customer_id, 'PAYMENT', 'Cash payment received',
    'Cash payment for parcel ' || p.tracking_number || ' was recorded.', p.id);
  perform write_audit('CASH_COLLECTED', 'payment', pay.id::text, null,
    jsonb_build_object('parcel_id', p.id, 'amount', pay.amount, 'reference', ref));

  return jsonb_build_object('payment_id', pay.id, 'status', 'SUCCESS');
end $$;

revoke execute on function create_payment_attempt(uuid) from public, anon;
grant  execute on function create_payment_attempt(uuid) to authenticated;
revoke execute on function mark_cash_collected(uuid) from public, anon;
grant  execute on function mark_cash_collected(uuid) to authenticated;