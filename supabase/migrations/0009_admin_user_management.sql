-- =====================================================================
-- DispatchHub 0009: admin user management (validated + audited)
-- Run once in Supabase SQL Editor, after 0001-0008.
-- =====================================================================
create or replace function admin_update_user(
  p_user_id uuid, p_role user_role, p_branch_id uuid, p_is_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  target profiles;
  v_branch uuid;
begin
  if uid is null or not is_admin() then
    raise exception 'Only administrators can change users.' using errcode = '42501';
  end if;
  if p_role is null or p_is_active is null then
    raise exception 'Role and status are required.' using errcode = '22023';
  end if;

  select * into target from profiles where id = p_user_id for update;
  if target.id is null then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;

  if target.id = uid and (p_role <> target.role or p_is_active = false) then
    raise exception 'You cannot change your own role or deactivate your own account.' using errcode = '22023';
  end if;

  if p_role in ('BRANCH_MANAGER','DELIVERY_PERSONNEL') then
    if p_branch_id is null or not exists (select 1 from branches where id = p_branch_id and is_active) then
      raise exception 'Select an active branch for staff accounts.' using errcode = '22023';
    end if;
    v_branch := p_branch_id;
  else
    v_branch := null;   -- customers and admins have no branch
  end if;

  if p_role = target.role and v_branch is not distinct from target.branch_id and p_is_active = target.is_active then
    return jsonb_build_object('id', target.id, 'role', target.role, 'unchanged', true);
  end if;

  if target.role = 'DELIVERY_PERSONNEL'
     and (p_role <> 'DELIVERY_PERSONNEL' or p_is_active = false or v_branch is distinct from target.branch_id)
     and exists (select 1 from delivery_assignments where personnel_id = target.id and status = 'ACTIVE') then
    raise exception 'This delivery person has active assignments. Reassign them first.' using errcode = '22023';
  end if;

  update profiles set role = p_role, branch_id = v_branch, is_active = p_is_active where id = target.id;

  perform write_audit('USER_UPDATED', 'profile', target.id::text,
    jsonb_build_object('role', target.role, 'branch_id', target.branch_id, 'is_active', target.is_active),
    jsonb_build_object('role', p_role, 'branch_id', v_branch, 'is_active', p_is_active));

  return jsonb_build_object('id', target.id, 'role', p_role, 'unchanged', false);
end $$;

revoke execute on function admin_update_user(uuid, user_role, uuid, boolean) from public, anon;
grant  execute on function admin_update_user(uuid, user_role, uuid, boolean) to authenticated;
