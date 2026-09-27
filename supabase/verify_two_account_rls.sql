-- Live two-account RLS audit for VertiGoes.
-- Uses the two newest Auth users, returns counts only, and never reads JSON/text contents.
-- Run only after both disposable users have a profile, day record, and bug report.

begin;

create temporary table audit_users on commit drop as
select id, row_number() over (order by created_at desc, id) as position
from (select id, created_at from auth.users order by created_at desc, id limit 2) newest;

do $$
begin
  if (select count(*) from audit_users) <> 2 then
    raise exception 'RLS audit requires at least two Auth users.';
  end if;
end;
$$;

select set_config('vertigoes.audit_user_a',
  (select id::text from audit_users where position = 1), false);
select set_config('vertigoes.audit_user_b',
  (select id::text from audit_users where position = 2), false);

create temporary table audit_results (
  check_name text not null,
  passed boolean not null,
  detail text not null
) on commit drop;
grant select, insert on audit_results to authenticated, anon;

create function pg_temp.cross_day_insert_is_blocked(target_user uuid)
returns boolean language plpgsql set search_path = '' as $$
begin
  insert into public.day_records(user_id, record_date, record)
  values (target_user, date '2099-12-31', jsonb_build_object(
    'date', '2099-12-31', 'episodes', 0, 'emergencyCall', false,
    'inAppHelp', null, 'sleepHours', null, 'feeling', null,
    'exercisePlan', 'once', 'exercises', '{}'::jsonb, 'liv', null
  ));
  return false;
exception when insufficient_privilege then
  return true;
end;
$$;
grant execute on function pg_temp.cross_day_insert_is_blocked(uuid) to authenticated;

create function pg_temp.anonymous_table_access_is_blocked(table_name text)
returns boolean language plpgsql set search_path = '' as $$
begin
  execute format('select 1 from public.%I limit 1', table_name);
  return false;
exception when insufficient_privilege then
  return true;
end;
$$;
grant execute on function pg_temp.anonymous_table_access_is_blocked(text) to anon;

-- User A: own rows are visible, B's rows are invisible, and writes cannot target B.
select set_config('request.jwt.claim.sub', current_setting('vertigoes.audit_user_a'), false);
set local role authenticated;

insert into audit_results
select 'A reads own profile', count(*) = 1, 'visible rows=' || count(*)
from public.profiles where id = current_setting('vertigoes.audit_user_a')::uuid;
insert into audit_results
select 'A cannot read B profile', count(*) = 0, 'visible rows=' || count(*)
from public.profiles where id = current_setting('vertigoes.audit_user_b')::uuid;
insert into audit_results
select 'A reads own calendar', count(*) > 0, 'visible rows=' || count(*)
from public.day_records where user_id = current_setting('vertigoes.audit_user_a')::uuid;
insert into audit_results
select 'A cannot read B calendar', count(*) = 0, 'visible rows=' || count(*)
from public.day_records where user_id = current_setting('vertigoes.audit_user_b')::uuid;
insert into audit_results
select 'A reads own bug report', count(*) > 0, 'visible rows=' || count(*)
from public.bug_reports where user_id = current_setting('vertigoes.audit_user_a')::uuid;
insert into audit_results
select 'A cannot read B bug report', count(*) = 0, 'visible rows=' || count(*)
from public.bug_reports where user_id = current_setting('vertigoes.audit_user_b')::uuid;
with changed as (
  update public.profiles set updated_at = updated_at
  where id = current_setting('vertigoes.audit_user_b')::uuid returning 1
)
insert into audit_results select 'A cannot update B profile', count(*) = 0,
  'updated rows=' || count(*) from changed;
insert into audit_results values ('A cannot insert B calendar row',
  pg_temp.cross_day_insert_is_blocked(current_setting('vertigoes.audit_user_b')::uuid),
  'RLS rejected cross-owner insert');

-- User B: repeat the same checks in the opposite direction.
reset role;
select set_config('request.jwt.claim.sub', current_setting('vertigoes.audit_user_b'), false);
set local role authenticated;

insert into audit_results
select 'B reads own profile', count(*) = 1, 'visible rows=' || count(*)
from public.profiles where id = current_setting('vertigoes.audit_user_b')::uuid;
insert into audit_results
select 'B cannot read A profile', count(*) = 0, 'visible rows=' || count(*)
from public.profiles where id = current_setting('vertigoes.audit_user_a')::uuid;
insert into audit_results
select 'B reads own calendar', count(*) > 0, 'visible rows=' || count(*)
from public.day_records where user_id = current_setting('vertigoes.audit_user_b')::uuid;
insert into audit_results
select 'B cannot read A calendar', count(*) = 0, 'visible rows=' || count(*)
from public.day_records where user_id = current_setting('vertigoes.audit_user_a')::uuid;
insert into audit_results
select 'B reads own bug report', count(*) > 0, 'visible rows=' || count(*)
from public.bug_reports where user_id = current_setting('vertigoes.audit_user_b')::uuid;
insert into audit_results
select 'B cannot read A bug report', count(*) = 0, 'visible rows=' || count(*)
from public.bug_reports where user_id = current_setting('vertigoes.audit_user_a')::uuid;
with changed as (
  update public.profiles set updated_at = updated_at
  where id = current_setting('vertigoes.audit_user_a')::uuid returning 1
)
insert into audit_results select 'B cannot update A profile', count(*) = 0,
  'updated rows=' || count(*) from changed;
insert into audit_results values ('B cannot insert A calendar row',
  pg_temp.cross_day_insert_is_blocked(current_setting('vertigoes.audit_user_a')::uuid),
  'RLS rejected cross-owner insert');

-- Anonymous callers must not have table access at all.
reset role;
set local role anon;
insert into audit_results values
  ('Anonymous profile access blocked', pg_temp.anonymous_table_access_is_blocked('profiles'), 'permission denied'),
  ('Anonymous calendar access blocked', pg_temp.anonymous_table_access_is_blocked('day_records'), 'permission denied'),
  ('Anonymous bug-report access blocked', pg_temp.anonymous_table_access_is_blocked('bug_reports'), 'permission denied');

reset role;
select check_name,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from (
  select check_name, passed, detail, 0 as sort_order from audit_results
  union all
  select 'OVERALL', bool_and(passed),
    count(*) filter (where passed)::text || '/' || count(*)::text || ' checks passed', 1
  from audit_results
) report
order by sort_order, check_name;

rollback;
