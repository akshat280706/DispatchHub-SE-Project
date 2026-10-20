-- =====================================================================
-- DispatchHub end-to-end database test.
-- Nothing is saved: the script ends with an exception on purpose.
-- Requires seed.sql and seed_demo_staff.sql.
-- =====================================================================
create function pg_temp.act(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.line(ok boolean, step text, detail text default '') returns text language sql as $$
  select case when ok then '[PASS] ' else '[FAIL] ' end || step
         || case when coalesce(detail, '') <> '' then '   (' || detail || ')' else '' end || E'\n'
$$;

do $e2e$
declare
  cust  uuid := (select id from profiles where email = 'customer@dispatchhub.test');
  mgr_m uuid := (select id from profiles where email = 'manager.mum@dispatchhub.test');
  mgr_p uuid := (select id from profiles where email = 'manager.pun@dispatchhub.test');
  rid_m uuid := (select id from profiles where email = 'rider.mum@dispatchhub.test');
  rid_p uuid := (select id from profiles where email = 'rider.pun@dispatchhub.test');
  adm   uuid := (select id from profiles where email = 'admin@dispatchhub.test');
  b_mum uuid := (select id from branches where code = 'MUM01');
  b_pun uuid := (select id from branches where code = 'PUN01');
  report text := '';
  par jsonb;
  res jsonb;
  pid uuid;
  pay_id uuid;
  cid uuid;
  trk text;
  otp text;
  wrong_otp text;
  v_status text;
  v_text text;
  v_count int;
begin
  if cust is null or mgr_m is null or mgr_p is null or rid_m is null or rid_p is null or adm is null then
    raise exception 'Demo accounts are missing. Create the 6 users and run seed_demo_staff.sql first.';
  end if;

  -- 1. Booking
  perform pg_temp.act(cust);
  par := create_parcel_booking(jsonb_build_object(
      'origin_branch_id', b_mum, 'destination_branch_id', b_pun,
      'sender_name', 'E2E Sender', 'sender_phone', '9000000001', 'pickup_address', '12 Demo Lane, Mumbai',
      'receiver_name', 'E2E Receiver', 'receiver_phone', '9000000002',
      'delivery_address', '34 Sample Road, Pune', 'delivery_city', 'Pune', 'delivery_pincode', '411005',
      'category', 'ELECTRONICS', 'weight_kg', 2.3, 'payment_method', 'DEV_SIMULATED'),
    'e2e-' || gen_random_uuid()::text);
  pid := (par->>'id')::uuid;
  trk := par->>'tracking_number';
  report := report || pg_temp.line(par->>'status' = 'BOOKED' and trk like 'DH%',
              'Customer books a parcel', trk || ', total ' || (par->>'total_amount'));

  -- 2. Development payment
  select id into pay_id from payments where parcel_id = pid;
  res := apply_payment_result(pay_id, 'SUCCESS', 'dev', 'DEV-E2E-' || substr(md5(random()::text), 1, 8));
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line(v_status = 'CONFIRMED', 'Dev payment succeeds, parcel becomes CONFIRMED', v_status);
  res := apply_payment_result(pay_id, 'SUCCESS', 'dev', 'DEV-E2E-REPEAT');
  report := report || pg_temp.line((res->>'already_processed')::boolean, 'Repeated payment callback is ignored');

  -- 3. Pickup assignment (wrong manager first)
  perform pg_temp.act(mgr_p);
  begin
    perform assign_parcel(pid, rid_m, 'PICKUP');
    report := report || pg_temp.line(false, 'Pune manager blocked from assigning a Mumbai pickup', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Pune manager blocked from assigning a Mumbai pickup', sqlerrm);
  end;

  perform pg_temp.act(mgr_m);
  perform assign_parcel(pid, rid_m, 'PICKUP');
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line(v_status = 'ASSIGNED', 'Mumbai manager assigns pickup, parcel is ASSIGNED', v_status);

  -- 4. Pickup (wrong rider first)
  perform pg_temp.act(rid_p);
  begin
    perform update_parcel_status(pid, 'PICKED_UP');
    report := report || pg_temp.line(false, 'Unassigned rider blocked from marking pickup', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Unassigned rider blocked from marking pickup', sqlerrm);
  end;

  perform pg_temp.act(rid_m);
  perform update_parcel_status(pid, 'PICKED_UP');
  perform pg_temp.act(mgr_m);
  perform update_parcel_status(pid, 'IN_TRANSIT');
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line(v_status = 'IN_TRANSIT', 'Pickup, then dispatch to IN_TRANSIT', v_status);

  -- 5. Arrival (origin manager first)
  begin
    perform update_parcel_status(pid, 'AT_DESTINATION_BRANCH');
    report := report || pg_temp.line(false, 'Origin manager blocked from confirming arrival', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Origin manager blocked from confirming arrival', sqlerrm);
  end;

  perform pg_temp.act(mgr_p);
  begin
    perform update_parcel_status(pid, 'DELIVERED');
    report := report || pg_temp.line(false, 'DELIVERED cannot be set directly', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'DELIVERED cannot be set directly', sqlerrm);
  end;

  perform update_parcel_status(pid, 'AT_DESTINATION_BRANCH');
  perform assign_parcel(pid, rid_p, 'DELIVERY');
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line(v_status = 'AT_DESTINATION_BRANCH',
              'Pune manager confirms arrival and assigns delivery', v_status);

  -- 6. Start delivery and OTP
  perform pg_temp.act(rid_p);
  perform start_delivery(pid);
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line(v_status = 'OUT_FOR_DELIVERY', 'Rider starts delivery', v_status);

  perform pg_temp.act(cust);
  res := get_dev_delivery_otp(pid);
  otp := res->>'otp';
  report := report || pg_temp.line(otp ~ '^[0-9]{6}$', 'Customer can see the development OTP', coalesce(res->>'notice', ''));

  -- 7. Verification rules
  perform pg_temp.act(rid_p);
  begin
    perform verify_delivery(pid, otp, '{}');
    report := report || pg_temp.line(false, 'Delivery blocked without a photo', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Delivery blocked without a photo', sqlerrm);
  end;

  -- photo upload through Storage is tested in Batch 7; skip the requirement for this test only
  update system_settings set value = 'false' where key = 'delivery.require_photo';

  wrong_otp := case when otp = '000000' then '111111' else '000000' end;
  res := verify_delivery(pid, wrong_otp, '{}');
  report := report || pg_temp.line((res->>'verified')::boolean = false, 'Wrong OTP is rejected',
              'attempts left: ' || (res->>'attempts_left'));

  res := verify_delivery(pid, otp, '{}');
  select status::text into v_status from parcels where id = pid;
  report := report || pg_temp.line((res->>'verified')::boolean and v_status = 'DELIVERED',
              'Correct OTP marks the parcel DELIVERED', v_status);

  begin
    perform verify_delivery(pid, otp, '{}');
    report := report || pg_temp.line(false, 'Delivery cannot be verified twice', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Delivery cannot be verified twice', sqlerrm);
  end;

  -- 8. Tracking history and privacy
  select string_agg(status::text, ' > ' order by created_at, id) into v_text
    from tracking_events where parcel_id = pid;
  report := report || pg_temp.line(
    v_text = 'BOOKED > CONFIRMED > ASSIGNED > PICKED_UP > IN_TRANSIT > AT_DESTINATION_BRANCH > OUT_FOR_DELIVERY > DELIVERED',
    'Tracking history is complete and in order', v_text);

  v_text := track_parcel(trk)::text;
  report := report || pg_temp.line(
    v_text like '%DELIVERED%' and v_text not like '%E2E Sender%' and v_text not like '%9000000001%'
      and v_text not like '%12 Demo Lane%',
    'Public tracking works and exposes no personal data');

  begin
    delete from tracking_events where parcel_id = pid;
    report := report || pg_temp.line(false, 'Tracking history is append-only', 'delete was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Tracking history is append-only', sqlerrm);
  end;

  -- 9. Row Level Security as real roles
  perform pg_temp.act(cust);
  set local role authenticated;
  select status::text into v_status from parcels where id = pid;
  reset role;
  report := report || pg_temp.line(v_status = 'DELIVERED', 'Customer sees DELIVERED through RLS', v_status);

  perform pg_temp.act(rid_p);
  set local role authenticated;
  select count(*) into v_count from parcels where id = pid;
  reset role;
  report := report || pg_temp.line(v_count = 1, 'Assigned rider can read the parcel', v_count::text);

  set local role authenticated;
  select count(*) into v_count from payments where parcel_id = pid;
  reset role;
  report := report || pg_temp.line(v_count = 0, 'Rider cannot read payments', v_count::text);

  -- 10. Complaint lifecycle
  insert into complaints (parcel_id, customer_id, subject, description)
  values (pid, cust, 'E2E complaint', 'The box was slightly damaged on arrival.')
  returning id into cid;

  perform pg_temp.act(mgr_p);
  perform update_complaint(cid, 'IN_REVIEW', null);
  begin
    perform update_complaint(cid, 'RESOLVED', null);
    report := report || pg_temp.line(false, 'Resolving needs notes', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Resolving needs notes', sqlerrm);
  end;
  perform update_complaint(cid, 'RESOLVED', 'Apologised and offered a goodwill credit.');
  perform update_complaint(cid, 'CLOSED', null);
  select status::text into v_status from complaints where id = cid;
  report := report || pg_temp.line(v_status = 'CLOSED', 'Complaint OPEN > IN_REVIEW > RESOLVED > CLOSED', v_status);

  select count(*) into v_count from notifications where user_id = cust and parcel_id = pid;
  report := report || pg_temp.line(v_count >= 8, 'Customer received notifications for this journey', v_count::text);

  -- 11. Stats
  perform pg_temp.act(cust);
  res := get_customer_stats();
  report := report || pg_temp.line((res->>'delivered')::int >= 1, 'Customer stats', res::text);
  perform pg_temp.act(rid_p);
  res := get_personnel_stats();
  report := report || pg_temp.line((res->>'completed_deliveries')::int >= 1, 'Personnel stats', res::text);
  perform pg_temp.act(mgr_p);
  res := get_branch_stats();
  report := report || pg_temp.line((res->>'parcel_count')::int >= 1, 'Branch stats (Pune)', 'parcel_count ' || (res->>'parcel_count'));
  perform pg_temp.act(adm);
  res := get_admin_stats();
  report := report || pg_temp.line((res->'parcels'->>'total')::int >= 1, 'Admin stats', 'parcels ' || (res->'parcels'->>'total'));

  perform pg_temp.act(cust);
  begin
    perform get_admin_stats();
    report := report || pg_temp.line(false, 'Customer blocked from admin stats', 'was allowed');
  exception when others then
    report := report || pg_temp.line(true, 'Customer blocked from admin stats', sqlerrm);
  end;

  raise exception E'\n===== E2E RESULT: % =====\n%\n(Everything above was rolled back. Nothing was saved.)',
    case when report like '%[FAIL]%' then 'SOME STEPS FAILED' else 'ALL STEPS PASSED' end, report;
end
$e2e$;