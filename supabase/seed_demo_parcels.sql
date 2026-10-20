-- =====================================================================
-- DispatchHub demo parcels (fictional). DEVELOPMENT ONLY.
-- Requires seed.sql and seed_demo_staff.sql.
-- =====================================================================
create function pg_temp.act(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.payload(o uuid, d uuid, city text, pin text, cat text, w numeric, method text, rname text)
returns jsonb language sql as $$
  select jsonb_build_object(
    'origin_branch_id', o, 'destination_branch_id', d,
    'sender_name', 'Ananya Rao', 'sender_phone', '9000000015',
    'pickup_address', '21 Sample Society, Andheri West, Mumbai',
    'receiver_name', rname, 'receiver_phone', '9000000099',
    'delivery_address', '8 Demo Nagar, ' || city, 'delivery_city', city, 'delivery_pincode', pin,
    'category', cat, 'weight_kg', w, 'payment_method', method)
$$;

-- 1 = pickup assigned, 2 = in transit, 3 = at destination + delivery assigned,
-- 4 = out for delivery, 5 = delivered
create function pg_temp.advance(p_id uuid, p_target int) returns void language plpgsql as $$
declare
  mgr_m uuid := (select id from profiles where email = 'manager.mum@dispatchhub.test');
  mgr_p uuid := (select id from profiles where email = 'manager.pun@dispatchhub.test');
  rid_m uuid := (select id from profiles where email = 'rider.mum@dispatchhub.test');
  rid_p uuid := (select id from profiles where email = 'rider.pun@dispatchhub.test');
begin
  if p_target >= 1 then
    perform pg_temp.act(mgr_m);
    perform assign_parcel(p_id, rid_m, 'PICKUP');
  end if;
  if p_target >= 2 then
    perform pg_temp.act(rid_m);
    perform update_parcel_status(p_id, 'PICKED_UP');
    perform pg_temp.act(mgr_m);
    perform update_parcel_status(p_id, 'IN_TRANSIT');
  end if;
  if p_target >= 3 then
    perform pg_temp.act(mgr_p);
    perform update_parcel_status(p_id, 'AT_DESTINATION_BRANCH');
    perform assign_parcel(p_id, rid_p, 'DELIVERY');
  end if;
  if p_target >= 4 then
    perform pg_temp.act(rid_p);
    perform start_delivery(p_id);
  end if;
  if p_target >= 5 then
    perform pg_temp.act(rid_p);
    perform verify_delivery(p_id,
      (select dev_otp from delivery_verifications where parcel_id = p_id and is_active), '{}'::uuid[]);
  end if;
end $$;

do $demo$
declare
  cust  uuid := (select id from profiles where email = 'customer@dispatchhub.test');
  mgr_p uuid := (select id from profiles where email = 'manager.pun@dispatchhub.test');
  b_mum uuid := (select id from branches where code = 'MUM01');
  b_pun uuid := (select id from branches where code = 'PUN01');
  b_del uuid := (select id from branches where code = 'DEL01');
  b_blr uuid := (select id from branches where code = 'BLR01');
  p uuid;
  pay uuid;
  cid uuid;
begin
  if cust is null or mgr_p is null then
    raise exception 'Run seed_demo_staff.sql first.';
  end if;
  if exists (select 1 from parcels where idempotency_key like 'demo-seed-%') then
    raise notice 'Demo parcels already exist. Nothing to do.';
    return;
  end if;

  -- 1: booked, dev payment still pending
  perform pg_temp.act(cust);
  perform create_parcel_booking(pg_temp.payload(b_mum, b_pun, 'Pune', '411005', 'GENERAL', 1.2, 'DEV_SIMULATED', 'Sanjay Kulkarni'), 'demo-seed-001');

  -- 2: confirmed (cash on pickup)
  perform pg_temp.act(cust);
  perform create_parcel_booking(pg_temp.payload(b_mum, b_del, 'Delhi', '110001', 'DOCUMENT', 0.4, 'CASH_ON_PICKUP', 'Neha Verma'), 'demo-seed-002');

  -- 3: pickup assigned
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_pun, 'Pune', '411005', 'FRAGILE', 3.5, 'CASH_ON_PICKUP', 'Rahul Joshi'), 'demo-seed-003')->>'id')::uuid;
  perform pg_temp.advance(p, 1);

  -- 4: in transit and delayed (paid)
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_blr, 'Bengaluru', '560001', 'ELECTRONICS', 2.8, 'DEV_SIMULATED', 'Kiran Hegde'), 'demo-seed-004')->>'id')::uuid;
  select id into pay from payments where parcel_id = p;
  perform apply_payment_result(pay, 'SUCCESS', 'dev', 'DEV-DEMO-004');
  perform pg_temp.advance(p, 2);
  update parcels set estimated_delivery_date = (now() at time zone 'Asia/Kolkata')::date - 1 where id = p;

  -- 5: at destination, delivery assigned
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_pun, 'Pune', '411005', 'CLOTHING', 1.0, 'CASH_ON_PICKUP', 'Pooja Nair'), 'demo-seed-005')->>'id')::uuid;
  perform pg_temp.advance(p, 3);

  -- 6: out for delivery (customer can see the development OTP)
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_pun, 'Pune', '411005', 'ELECTRONICS', 5.0, 'CASH_ON_PICKUP', 'Amit Bhosale'), 'demo-seed-006')->>'id')::uuid;
  perform pg_temp.advance(p, 4);

  -- 7: delivered (photo requirement skipped for seed data only, then restored)
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_pun, 'Pune', '411005', 'GENERAL', 2.0, 'DEV_SIMULATED', 'Sneha Pawar'), 'demo-seed-007')->>'id')::uuid;
  select id into pay from payments where parcel_id = p;
  perform apply_payment_result(pay, 'SUCCESS', 'dev', 'DEV-DEMO-007');
  update system_settings set value = 'false' where key = 'delivery.require_photo';
  perform pg_temp.advance(p, 5);
  update system_settings set value = 'true' where key = 'delivery.require_photo';

  -- 8: cancelled and refunded (record only)
  perform pg_temp.act(cust);
  p := (create_parcel_booking(pg_temp.payload(b_mum, b_del, 'Delhi', '110001', 'OTHER', 1.5, 'DEV_SIMULATED', 'Rohit Malhotra'), 'demo-seed-008')->>'id')::uuid;
  select id into pay from payments where parcel_id = p;
  perform apply_payment_result(pay, 'SUCCESS', 'dev', 'DEV-DEMO-008');
  perform pg_temp.act(cust);
  perform cancel_parcel(p, 'Ordered by mistake');

  -- complaints: one OPEN, one IN_REVIEW
  insert into complaints (parcel_id, customer_id, subject, description)
  select id, cust, 'Parcel arrived with a dented box',
         'The outer box was dented when the parcel was handed over. Please review.'
    from parcels where idempotency_key = 'demo-seed-007';

  insert into complaints (parcel_id, customer_id, subject, description)
  select id, cust, 'Delivery taking longer than expected',
         'The parcel was expected earlier. Please share an update.'
    from parcels where idempotency_key = 'demo-seed-006'
  returning id into cid;
  perform pg_temp.act(mgr_p);
  perform update_complaint(cid, 'IN_REVIEW', null);
end
$demo$;

select p.tracking_number, p.status, p.total_amount, o.code as origin, d.code as destination
from parcels p
join branches o on o.id = p.origin_branch_id
join branches d on d.id = p.destination_branch_id
where p.idempotency_key like 'demo-seed-%'
order by p.idempotency_key;