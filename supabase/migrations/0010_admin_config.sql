-- =====================================================================
-- DispatchHub 0010: admin branch / rate / setting management (validated + audited)
-- Run once in Supabase SQL Editor, after 0001-0009.
-- =====================================================================

-- ---------- Branches ----------
create or replace function admin_upsert_branch(
  p_id uuid, p_code text, p_name text, p_city text, p_state text,
  p_address text, p_pincode text, p_phone text, p_is_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  old_row branches;
  new_row branches;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_pin text := nullif(trim(coalesce(p_pincode, '')), '');
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'Only administrators can manage branches.' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9]{3,10}$' then
    raise exception 'Branch code must be 3 to 10 letters or digits.' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(trim(coalesce(p_city, ''))) < 2
     or length(trim(coalesce(p_state, ''))) < 2 then
    raise exception 'Name, city and state are required.' using errcode = '22023';
  end if;
  if v_pin is not null and v_pin !~ '^[0-9]{6}$' then
    raise exception 'Pincode must be 6 digits.' using errcode = '22023';
  end if;
  if p_is_active is null then
    raise exception 'Status is required.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into branches (code, name, city, state, address, pincode, phone, is_active)
    values (v_code, trim(p_name), trim(p_city), trim(p_state),
            nullif(trim(coalesce(p_address, '')), ''), v_pin,
            nullif(trim(coalesce(p_phone, '')), ''), p_is_active)
    returning * into new_row;
    perform write_audit('BRANCH_CREATED', 'branch', new_row.id::text, null, to_jsonb(new_row));
  else
    select * into old_row from branches where id = p_id for update;
    if old_row.id is null then
      raise exception 'Branch not found.' using errcode = 'P0002';
    end if;

    if old_row.is_active and not p_is_active then
      if exists (select 1 from profiles
                  where branch_id = p_id and is_active
                    and role in ('BRANCH_MANAGER', 'DELIVERY_PERSONNEL')) then
        raise exception 'This branch still has active staff. Move or deactivate them first.' using errcode = '22023';
      end if;
      if exists (select 1 from parcels
                  where (origin_branch_id = p_id or destination_branch_id = p_id)
                    and status not in ('DELIVERED', 'RETURNED', 'CANCELLED')) then
        raise exception 'This branch still has parcels in progress.' using errcode = '22023';
      end if;
    end if;

    update branches
       set code = v_code, name = trim(p_name), city = trim(p_city), state = trim(p_state),
           address = nullif(trim(coalesce(p_address, '')), ''), pincode = v_pin,
           phone = nullif(trim(coalesce(p_phone, '')), ''), is_active = p_is_active
     where id = p_id
     returning * into new_row;
    perform write_audit('BRANCH_UPDATED', 'branch', new_row.id::text, to_jsonb(old_row), to_jsonb(new_row));
  end if;

  return to_jsonb(new_row);
exception when unique_violation then
  raise exception 'A branch with this code already exists.' using errcode = '22023';
end $$;

-- ---------- Shipping rates ----------
create or replace function admin_upsert_rate(
  p_id uuid, p_zone rate_zone, p_category parcel_category,
  p_base_charge numeric, p_base_weight_kg numeric, p_per_kg_charge numeric,
  p_handling_surcharge numeric, p_is_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  old_row shipping_rates;
  new_row shipping_rates;
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'Only administrators can manage shipping rates.' using errcode = '42501';
  end if;
  if p_zone is null or p_category is null or p_is_active is null then
    raise exception 'Zone, category and status are required.' using errcode = '22023';
  end if;
  if p_base_charge is null or p_base_charge < 0 or p_base_charge > 100000
     or p_per_kg_charge is null or p_per_kg_charge < 0 or p_per_kg_charge > 100000
     or p_handling_surcharge is null or p_handling_surcharge < 0 or p_handling_surcharge > 100000 then
    raise exception 'Charges must be between 0 and 100000.' using errcode = '22023';
  end if;
  if p_base_weight_kg is null or p_base_weight_kg <= 0 or p_base_weight_kg > 1000 then
    raise exception 'Base weight must be above 0 and at most 1000 kg.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into shipping_rates (zone, category, base_charge, base_weight_kg, per_kg_charge, handling_surcharge, is_active)
    values (p_zone, p_category, round(p_base_charge, 2), round(p_base_weight_kg, 2),
            round(p_per_kg_charge, 2), round(p_handling_surcharge, 2), p_is_active)
    returning * into new_row;
    perform write_audit('RATE_CREATED', 'shipping_rate', new_row.id::text, null, to_jsonb(new_row));
  else
    select * into old_row from shipping_rates where id = p_id for update;
    if old_row.id is null then
      raise exception 'Rate not found.' using errcode = 'P0002';
    end if;
    update shipping_rates
       set zone = p_zone, category = p_category, base_charge = round(p_base_charge, 2),
           base_weight_kg = round(p_base_weight_kg, 2), per_kg_charge = round(p_per_kg_charge, 2),
           handling_surcharge = round(p_handling_surcharge, 2), is_active = p_is_active
     where id = p_id
     returning * into new_row;
    perform write_audit('RATE_UPDATED', 'shipping_rate', new_row.id::text, to_jsonb(old_row), to_jsonb(new_row));
  end if;

  return to_jsonb(new_row);
exception when unique_violation then
  raise exception 'An active rate already exists for this zone and category.' using errcode = '22023';
end $$;

-- ---------- System settings (existing keys only, validated by key) ----------
create or replace function admin_update_setting(p_key text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  old_row system_settings;
  v_num numeric;
begin
  if auth.uid() is null or not is_admin() then
    raise exception 'Only administrators can change settings.' using errcode = '42501';
  end if;

  select * into old_row from system_settings where key = p_key for update;
  if old_row.key is null then
    raise exception 'Unknown setting.' using errcode = 'P0002';
  end if;
  if p_value is null then
    raise exception 'A value is required.' using errcode = '22023';
  end if;

  if p_key = 'tax.gst_percent' then
    if jsonb_typeof(p_value) <> 'number' then raise exception 'Enter a number.' using errcode = '22023'; end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num < 0 or v_num > 100 then raise exception 'GST must be between 0 and 100.' using errcode = '22023'; end if;
  elsif p_key = 'booking.max_weight_kg' then
    if jsonb_typeof(p_value) <> 'number' then raise exception 'Enter a number.' using errcode = '22023'; end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num <= 0 or v_num > 1000 then raise exception 'Maximum weight must be above 0 and at most 1000 kg.' using errcode = '22023'; end if;
  elsif p_key like 'delivery.estimate_days.%' then
    if jsonb_typeof(p_value) <> 'number' then raise exception 'Enter a number.' using errcode = '22023'; end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num < 1 or v_num > 60 or v_num <> trunc(v_num) then raise exception 'Enter a whole number of days from 1 to 60.' using errcode = '22023'; end if;
  elsif p_key = 'delivery.otp_expiry_hours' then
    if jsonb_typeof(p_value) <> 'number' then raise exception 'Enter a number.' using errcode = '22023'; end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num < 1 or v_num > 168 or v_num <> trunc(v_num) then raise exception 'Enter whole hours from 1 to 168.' using errcode = '22023'; end if;
  elsif p_key = 'delivery.otp_max_attempts' then
    if jsonb_typeof(p_value) <> 'number' then raise exception 'Enter a number.' using errcode = '22023'; end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num < 1 or v_num > 10 or v_num <> trunc(v_num) then raise exception 'Enter a whole number from 1 to 10.' using errcode = '22023'; end if;
  elsif p_key in ('delivery.require_photo', 'dev.show_delivery_otp') then
    if jsonb_typeof(p_value) <> 'boolean' then raise exception 'Choose true or false.' using errcode = '22023'; end if;
  elsif p_key like 'contact.%' then
    if jsonb_typeof(p_value) <> 'string' or length(trim(p_value #>> '{}')) < 3 or length(p_value #>> '{}') > 200 then
      raise exception 'Enter text between 3 and 200 characters.' using errcode = '22023';
    end if;
  else
    raise exception 'This setting cannot be edited here.' using errcode = '22023';
  end if;

  update system_settings set value = p_value, updated_by = auth.uid(), updated_at = now() where key = p_key;
  perform write_audit('SETTING_UPDATED', 'system_setting', p_key,
    jsonb_build_object('value', old_row.value), jsonb_build_object('value', p_value));

  return jsonb_build_object('key', p_key, 'value', p_value);
end $$;

-- ---------- Permissions ----------
revoke execute on function admin_upsert_branch(uuid, text, text, text, text, text, text, text, boolean) from public, anon;
grant  execute on function admin_upsert_branch(uuid, text, text, text, text, text, text, text, boolean) to authenticated;
revoke execute on function admin_upsert_rate(uuid, rate_zone, parcel_category, numeric, numeric, numeric, numeric, boolean) from public, anon;
grant  execute on function admin_upsert_rate(uuid, rate_zone, parcel_category, numeric, numeric, numeric, numeric, boolean) to authenticated;
revoke execute on function admin_update_setting(text, jsonb) from public, anon;
grant  execute on function admin_update_setting(text, jsonb) to authenticated;

-- Direct writes are no longer possible from the browser. Changes go through the audited functions above.
revoke insert, update on branches, shipping_rates, system_settings from authenticated;
