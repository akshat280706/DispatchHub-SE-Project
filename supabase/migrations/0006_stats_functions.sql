-- =====================================================================
-- DispatchHub 0006: dashboard statistics (all numbers come from real rows)
-- Run once in Supabase SQL Editor, after 0001-0005.
-- Dates are interpreted in India time (Asia/Kolkata).
-- =====================================================================

-- ---------- Customer ----------
create or replace function get_customer_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or current_user_role() is distinct from 'CUSTOMER' then
    raise exception 'Only customer accounts can view customer statistics.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total_bookings',   (select count(*) from parcels where customer_id = uid),
    'active_shipments', (select count(*) from parcels
                          where customer_id = uid and status not in ('DELIVERED','RETURNED','CANCELLED')),
    'delivered',        (select count(*) from parcels where customer_id = uid and status = 'DELIVERED'),
    'cancelled',        (select count(*) from parcels where customer_id = uid and status = 'CANCELLED'),
    'open_complaints',  (select count(*) from complaints
                          where customer_id = uid and status in ('OPEN','IN_REVIEW')),
    'unread_notifications', (select count(*) from notifications where user_id = uid and not is_read)
  );
end $$;

-- ---------- Delivery personnel ----------
create or replace function get_personnel_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or current_user_role() is distinct from 'DELIVERY_PERSONNEL' then
    raise exception 'Only delivery personnel can view these statistics.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'assigned_total', (select count(*) from delivery_assignments
                        where personnel_id = uid and status = 'ACTIVE'),
    'pending_pickups', (select count(*) from delivery_assignments a join parcels p on p.id = a.parcel_id
                         where a.personnel_id = uid and a.status = 'ACTIVE'
                           and a.assignment_type = 'PICKUP' and p.status = 'ASSIGNED'),
    'pending_deliveries', (select count(*) from delivery_assignments a join parcels p on p.id = a.parcel_id
                         where a.personnel_id = uid and a.status = 'ACTIVE'
                           and a.assignment_type = 'DELIVERY'
                           and p.status in ('AT_DESTINATION_BRANCH','DELIVERY_FAILED')),
    'out_for_delivery', (select count(*) from delivery_assignments a join parcels p on p.id = a.parcel_id
                         where a.personnel_id = uid and a.status = 'ACTIVE'
                           and a.assignment_type = 'DELIVERY' and p.status = 'OUT_FOR_DELIVERY'),
    'completed_pickups', (select count(*) from delivery_assignments
                           where personnel_id = uid and assignment_type = 'PICKUP' and status = 'COMPLETED'),
    'completed_deliveries', (select count(*) from delivery_assignments a join parcels p on p.id = a.parcel_id
                         where a.personnel_id = uid and a.assignment_type = 'DELIVERY'
                           and a.status = 'COMPLETED' and p.status = 'DELIVERED'),
    'completed_today', (select count(*) from delivery_assignments
                         where personnel_id = uid and status = 'COMPLETED'
                           and (completed_at at time zone 'Asia/Kolkata')::date
                               = (now() at time zone 'Asia/Kolkata')::date)
  );
end $$;

-- ---------- Branch (manager: own branch; admin: pass p_branch_id) ----------
create or replace function get_branch_stats(
  p_from date default null, p_to date default null, p_branch_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  role_now user_role := current_user_role();
  v_branch uuid;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_from date;
  v_to date;
  b branches;
begin
  if auth.uid() is null or role_now is null or role_now not in ('BRANCH_MANAGER','ADMIN') then
    raise exception 'Only branch managers and admins can view branch reports.' using errcode = '42501';
  end if;

  v_branch := case when role_now = 'ADMIN' then p_branch_id else current_branch_id() end;
  if v_branch is null then
    raise exception 'Select a branch.' using errcode = '22023';
  end if;
  select * into b from branches where id = v_branch;
  if b.id is null then
    raise exception 'Branch not found.' using errcode = 'P0002';
  end if;

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, v_to - 29);
  if v_from > v_to then
    raise exception 'The start date must be on or before the end date.' using errcode = '22023';
  end if;
  if v_to - v_from > 366 then
    raise exception 'Choose a range of at most 366 days.' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'branch', jsonb_build_object('id', b.id, 'code', b.code, 'name', b.name, 'city', b.city),
    'from', v_from,
    'to', v_to,
    'parcel_count', (select count(*) from parcels p
                      where (p.origin_branch_id = v_branch or p.destination_branch_id = v_branch)
                        and (p.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
    'by_status', (select coalesce(jsonb_object_agg(s.status::text, s.n), '{}'::jsonb)
                    from (select p.status, count(*) as n from parcels p
                           where (p.origin_branch_id = v_branch or p.destination_branch_id = v_branch)
                             and (p.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to
                           group by p.status) s),
    -- operational counts below are "right now", not limited to the date range
    'pending_assignments', (select count(*) from parcels p
        where (p.origin_branch_id = v_branch and p.status = 'CONFIRMED')
           or (p.destination_branch_id = v_branch
               and p.status in ('AT_DESTINATION_BRANCH','DELIVERY_FAILED')
               and not exists (select 1 from delivery_assignments a
                                where a.parcel_id = p.id and a.assignment_type = 'DELIVERY'
                                  and a.status = 'ACTIVE'))),
    'in_transit', (select count(*) from parcels p
                    where p.status = 'IN_TRANSIT'
                      and (p.origin_branch_id = v_branch or p.destination_branch_id = v_branch)),
    'delayed', (select count(*) from parcels p
                 where (p.origin_branch_id = v_branch or p.destination_branch_id = v_branch)
                   and p.estimated_delivery_date < v_today
                   and p.status not in ('DELIVERED','RETURNED','CANCELLED')),
    'personnel', (select coalesce(jsonb_agg(jsonb_build_object(
                      'id', pr.id, 'full_name', pr.full_name, 'is_available', pr.is_available,
                      'active_assignments', (select count(*) from delivery_assignments a
                                              where a.personnel_id = pr.id and a.status = 'ACTIVE'))
                      order by pr.full_name), '[]'::jsonb)
                    from profiles pr
                   where pr.role = 'DELIVERY_PERSONNEL' and pr.branch_id = v_branch and pr.is_active),
    'complaints', (select coalesce(jsonb_object_agg(s.status::text, s.n), '{}'::jsonb)
                     from (select c.status, count(*) as n
                             from complaints c join parcels p on p.id = c.parcel_id
                            where p.origin_branch_id = v_branch or p.destination_branch_id = v_branch
                            group by c.status) s),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                         'date', v_from + g.i, 'bookings', coalesce(x.n, 0)) order by g.i), '[]'::jsonb)
                from generate_series(0, v_to - v_from) as g(i)
                left join (select (p.created_at at time zone 'Asia/Kolkata')::date as day, count(*) as n
                             from parcels p
                            where p.origin_branch_id = v_branch or p.destination_branch_id = v_branch
                            group by 1) x on x.day = v_from + g.i)
  );
end $$;

-- ---------- Administrator ----------
create or replace function get_admin_stats(p_from date default null, p_to date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_from date;
  v_to date;
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'Only administrators can view system-wide statistics.' using errcode = '42501';
  end if;

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, v_to - 29);
  if v_from > v_to then
    raise exception 'The start date must be on or before the end date.' using errcode = '22023';
  end if;
  if v_to - v_from > 366 then
    raise exception 'Choose a range of at most 366 days.' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'from', v_from,
    'to', v_to,
    'users', jsonb_build_object(
      'total',  (select count(*) from profiles),
      'active', (select count(*) from profiles where is_active),
      'by_role', (select coalesce(jsonb_object_agg(s.role::text, s.n), '{}'::jsonb)
                    from (select role, count(*) as n from profiles group by role) s)),
    'parcels', jsonb_build_object(
      'total',     (select count(*) from parcels),
      'active',    (select count(*) from parcels where status not in ('DELIVERED','RETURNED','CANCELLED')),
      'delivered', (select count(*) from parcels where status = 'DELIVERED'),
      'cancelled', (select count(*) from parcels where status = 'CANCELLED'),
      'delayed',   (select count(*) from parcels
                     where estimated_delivery_date < v_today
                       and status not in ('DELIVERED','RETURNED','CANCELLED')),
      'in_range',  (select count(*) from parcels
                     where (created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
      'by_status', (select coalesce(jsonb_object_agg(s.status::text, s.n), '{}'::jsonb)
                      from (select status, count(*) as n from parcels
                             where (created_at at time zone 'Asia/Kolkata')::date between v_from and v_to
                             group by status) s)),
    'payments', (select jsonb_build_object(
                   'success_count',   count(*) filter (where pm.status = 'SUCCESS'),
                   'success_amount',  coalesce(sum(pm.amount) filter (where pm.status = 'SUCCESS'), 0),
                   'pending_count',   count(*) filter (where pm.status = 'PENDING'),
                   'pending_amount',  coalesce(sum(pm.amount) filter (where pm.status = 'PENDING'), 0),
                   'failed_count',    count(*) filter (where pm.status = 'FAILED'),
                   'refunded_count',  count(*) filter (where pm.status = 'REFUNDED'),
                   'refunded_amount', coalesce(sum(pm.amount) filter (where pm.status = 'REFUNDED'), 0))
                 from payments pm
                 where (pm.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
    'branches', (select coalesce(jsonb_agg(jsonb_build_object(
                    'id', b.id, 'code', b.code, 'name', b.name, 'city', b.city,
                    'origin_parcels', (select count(*) from parcels p
                        where p.origin_branch_id = b.id
                          and (p.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
                    'destination_parcels', (select count(*) from parcels p
                        where p.destination_branch_id = b.id
                          and (p.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
                    'active_parcels', (select count(*) from parcels p
                        where (p.origin_branch_id = b.id or p.destination_branch_id = b.id)
                          and p.status not in ('DELIVERED','RETURNED','CANCELLED'))
                  ) order by b.code), '[]'::jsonb)
                 from branches b where b.is_active),
    'complaints', (select coalesce(jsonb_object_agg(s.status::text, s.n), '{}'::jsonb)
                     from (select status, count(*) as n from complaints group by status) s),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                        'date', v_from + g.i,
                        'bookings', coalesce(pb.n, 0),
                        'revenue', coalesce(pr.amt, 0)) order by g.i), '[]'::jsonb)
                from generate_series(0, v_to - v_from) as g(i)
                left join (select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as n
                             from parcels group by 1) pb on pb.day = v_from + g.i
                left join (select (paid_at at time zone 'Asia/Kolkata')::date as day, sum(amount) as amt
                             from payments where status = 'SUCCESS' group by 1) pr on pr.day = v_from + g.i)
  );
end $$;

-- ---------- Function permissions ----------
revoke execute on function get_customer_stats()                  from public, anon;
grant  execute on function get_customer_stats()                  to authenticated;
revoke execute on function get_personnel_stats()                 from public, anon;
grant  execute on function get_personnel_stats()                 to authenticated;
revoke execute on function get_branch_stats(date, date, uuid)    from public, anon;
grant  execute on function get_branch_stats(date, date, uuid)    to authenticated;
revoke execute on function get_admin_stats(date, date)           from public, anon;
grant  execute on function get_admin_stats(date, date)           to authenticated;