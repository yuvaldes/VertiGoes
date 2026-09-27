-- Read-only checks for the Supabase SQL Editor, AFTER applying both migrations.
-- These queries show configuration/counts, never patients' answers or calendar contents.

-- All three rows must have rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles','day_records','bug_reports');

-- Expected policies: owner-only profiles/day_records, and own report insert/select.
-- Review ALL returned policies: an additional permissive policy can weaken isolation.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles','day_records','bug_reports')
order by tablename, policyname;

-- Every anonymous privilege and both report mutation privileges must be false.
select table_name,
  has_table_privilege('anon', 'public.' || table_name, 'SELECT') as anon_can_select,
  has_table_privilege('anon', 'public.' || table_name, 'INSERT') as anon_can_insert,
  has_table_privilege('anon', 'public.' || table_name, 'UPDATE') as anon_can_update,
  has_table_privilege('anon', 'public.' || table_name, 'DELETE') as anon_can_delete
from unnest(array['profiles','day_records','bug_reports']) as t(table_name);
select has_table_privilege('authenticated','public.bug_reports','UPDATE') as users_can_edit_reports,
  has_table_privilege('authenticated','public.bug_reports','DELETE') as users_can_delete_reports,
  has_column_privilege('authenticated','public.bug_reports','status','INSERT') as users_can_set_report_status,
  has_column_privilege('authenticated','public.bug_reports','created_at','INSERT') as users_can_set_report_time;

-- Five hardening triggers must be present and enabled (O = normal enabled).
select c.relname as table_name, t.tgname as trigger_name, t.tgenabled as enabled
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and t.tgname in (
  'profiles_validate_health','day_records_validate_health',
  'profiles_write_limit','day_records_write_limit','bug_reports_write_limit')
order by c.relname, t.tgname;

-- These must all be false; a client must never access the counters or invoke their functions.
select has_schema_privilege('anon','vertigoes_private','USAGE') as anon_private_schema,
  has_schema_privilege('authenticated','vertigoes_private','USAGE') as user_private_schema,
  has_table_privilege('authenticated','vertigoes_private.write_limits','DELETE') as user_can_reset_quotas,
  has_function_privilege('authenticated','vertigoes_private.enforce_write_limit()','EXECUTE') as user_can_call_quota_function;

-- Existing invalid rows are preserved, NOT silently deleted or rewritten by the migration.
-- If either count is nonzero, repair/export those records with their owner before launch.
select 'profiles' as table_name, count(*) as legacy_invalid_rows
from public.profiles where answers is not null and not vertigoes_private.valid_profile_answers(answers)
union all
select 'day_records', count(*) from public.day_records
where not vertigoes_private.valid_day_record(record,record_date);

-- Still perform end-to-end tests with TWO signed-in test users. Admin SQL execution bypasses
-- RLS and therefore does not itself demonstrate user-to-user isolation in the live API.
