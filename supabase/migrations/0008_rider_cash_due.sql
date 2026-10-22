-- =====================================================================
-- DispatchHub 0008: lets the assigned pickup rider see whether cash is due
-- Run once in Supabase SQL Editor, after 0001-0007.
-- =====================================================================
create or replace function get_cash_due(p_parcel_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pay payments;
begin
  if auth.uid() is null or current_user_role() is distinct from 'DELIVERY_PERSONNEL' then
    return null;
  end if;
  if not exists (
       select 1 from delivery_assignments
        where parcel_id = p_parcel_id and personnel_id = auth.uid()
          and assignment_type = 'PICKUP' and status in ('ACTIVE','COMPLETED')) then
    return null;
  end if;

  select * into pay from payments
   where parcel_id = p_parcel_id and method = 'CASH_ON_PICKUP' and status = 'PENDING'
   order by created_at desc limit 1;
  if pay.id is null then
    return null;
  end if;

  return jsonb_build_object('payment_id', pay.id, 'amount', pay.amount);
end $$;

revoke execute on function get_cash_due(uuid) from public, anon;
grant  execute on function get_cash_due(uuid) to authenticated;
