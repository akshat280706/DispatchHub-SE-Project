-- =====================================================================
-- DispatchHub demo staff: promotes the 6 demo auth users. Safe to re-run.
-- DEVELOPMENT ONLY. Fictional people and phone numbers.
-- =====================================================================
do $$
declare missing text;
begin
  select string_agg(e, ', ') into missing
  from unnest(array[
    'admin@dispatchhub.test', 'manager.mum@dispatchhub.test', 'manager.pun@dispatchhub.test',
    'rider.mum@dispatchhub.test', 'rider.pun@dispatchhub.test', 'customer@dispatchhub.test'
  ]) as e
  where not exists (select 1 from profiles where email = e);

  if missing is not null then
    raise exception 'Create these users in Authentication > Users first: %', missing;
  end if;
end $$;

update profiles set role = 'ADMIN', full_name = 'Demo Admin', phone = '9000000010'
 where email = 'admin@dispatchhub.test';

update profiles set role = 'BRANCH_MANAGER', branch_id = (select id from branches where code = 'MUM01'),
       full_name = 'Meera Kulkarni', phone = '9000000011', city = 'Mumbai', state = 'Maharashtra'
 where email = 'manager.mum@dispatchhub.test';

update profiles set role = 'BRANCH_MANAGER', branch_id = (select id from branches where code = 'PUN01'),
       full_name = 'Rohan Deshmukh', phone = '9000000012', city = 'Pune', state = 'Maharashtra'
 where email = 'manager.pun@dispatchhub.test';

update profiles set role = 'DELIVERY_PERSONNEL', branch_id = (select id from branches where code = 'MUM01'),
       full_name = 'Imran Shaikh', phone = '9000000013', city = 'Mumbai', state = 'Maharashtra'
 where email = 'rider.mum@dispatchhub.test';

update profiles set role = 'DELIVERY_PERSONNEL', branch_id = (select id from branches where code = 'PUN01'),
       full_name = 'Vikram Patil', phone = '9000000014', city = 'Pune', state = 'Maharashtra'
 where email = 'rider.pun@dispatchhub.test';

update profiles set full_name = 'Ananya Rao', phone = '9000000015', city = 'Mumbai', state = 'Maharashtra'
 where email = 'customer@dispatchhub.test';

select p.email, p.full_name, p.role, b.code as branch
from profiles p left join branches b on b.id = p.branch_id
where p.email like '%@dispatchhub.test'
order by p.role, p.email;