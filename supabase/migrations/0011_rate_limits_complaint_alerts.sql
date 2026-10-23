-- =====================================================================
-- DispatchHub 0011: rate limiting, contact RPC, complaint alerts
-- Run once in Supabase SQL Editor, after 0001-0010.
-- =====================================================================

-- ---------- Rate limit storage (no client access at all) ----------
create table rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);
alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

create or replace function client_fingerprint()
returns text language plpgsql stable as $$
declare
  h json;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    h := null;
  end;
  return coalesce(
    nullif(h->>'cf-connecting-ip', ''),
    nullif(trim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown');
end $$;

-- Fixed window counter. Returns false once the limit is exceeded.
create or replace function check_rate_limit(p_key text, p_max int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_hits int;
begin
  insert into rate_limits (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case when rate_limits.window_start < now() - p_window then now() else rate_limits.window_start end,
        hits         = case when rate_limits.window_start < now() - p_window then 1 else rate_limits.hits + 1 end
  returning hits into v_hits;

  if random() < 0.05 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits <= p_max;
end $$;

revoke execute on function client_fingerprint()                      from public, anon, authenticated;
revoke execute on function check_rate_limit(text, int, interval)     from public, anon, authenticated;

-- ---------- Public tracking, now rate limited (60 lookups per 10 minutes per client) ----------
-- A limited call RETURNS {rate_limited:true}. Raising an error would roll back the counter.
create or replace function track_parcel(p_tracking_number text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
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

  if not check_rate_limit('track:' || client_fingerprint(), 60, interval '10 minutes') then
    return jsonb_build_object('rate_limited', true);
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

revoke execute on function track_parcel(text) from public;
grant  execute on function track_parcel(text) to anon, authenticated;

-- ---------- Contact form through a rate-limited function (5 per hour per client) ----------
create or replace function submit_contact_message(p_name text, p_email text, p_subject text, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_name, ''))) not between 2 and 100 then
    raise exception 'Enter your name (2 to 100 characters).' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_email, ''))) not between 5 and 150
     or trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_subject, ''))) not between 3 and 150 then
    raise exception 'Enter a subject (3 to 150 characters).' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_message, ''))) not between 10 and 2000 then
    raise exception 'Write a message of 10 to 2000 characters.' using errcode = '22023';
  end if;

  if not check_rate_limit('contact:' || client_fingerprint(), 5, interval '1 hour') then
    return jsonb_build_object('rate_limited', true);
  end if;

  insert into contact_messages (name, email, subject, message)
  values (trim(p_name), trim(p_email), trim(p_subject), trim(p_message));
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function submit_contact_message(text, text, text, text) from public;
grant  execute on function submit_contact_message(text, text, text, text) to anon, authenticated;

-- Direct inserts are closed. Messages now arrive only through the function above.
revoke insert on contact_messages from anon, authenticated;

-- ---------- Alert managers and admins about a new complaint ----------
create or replace function notify_on_new_complaint()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p parcels;
  msg text;
begin
  select * into p from parcels where id = new.parcel_id;
  if p.id is null then
    return new;
  end if;
  msg := 'New complaint ' || new.complaint_number || ' on parcel ' || p.tracking_number || ': ' || new.subject;

  perform notify_branch_managers(p.origin_branch_id, 'COMPLAINT', 'New complaint', msg, p.id);
  if p.destination_branch_id <> p.origin_branch_id then
    perform notify_branch_managers(p.destination_branch_id, 'COMPLAINT', 'New complaint', msg, p.id);
  end if;

  insert into notifications (user_id, type, title, message, parcel_id)
  select id, 'COMPLAINT', 'New complaint', msg, p.id from profiles where role = 'ADMIN' and is_active;
  return new;
end $$;

create trigger complaints_notify after insert on complaints
  for each row execute function notify_on_new_complaint();
