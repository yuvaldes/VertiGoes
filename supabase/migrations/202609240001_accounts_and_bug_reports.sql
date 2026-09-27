begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_status text not null default 'pending'
    check (onboarding_status in ('pending', 'skipped', 'complete')),
  answers jsonb,
  progress_step integer check (progress_step between 0 and 4),
  updated_at timestamptz not null default now(),
  check ((onboarding_status = 'complete') = (answers is not null)),
  check (answers is null or jsonb_typeof(answers) = 'object')
);

create table public.day_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, record_date),
  check (record ? 'date' and record ->> 'date' = record_date::text)
);

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (
    char_length(description) between 1 and 3000 and description !~ '^[[:space:]]*$'
  ),
  platform text not null check (platform in ('web', 'ios', 'android', 'windows', 'macos')),
  locale text not null check (locale in ('en', 'he')),
  app_version text not null check (char_length(app_version) between 1 and 40),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
create index bug_reports_user_id_idx on public.bug_reports(user_id);
create index bug_reports_created_at_idx on public.bug_reports(created_at desc);

create function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger day_records_updated_at before update on public.day_records
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.day_records enable row level security;
alter table public.bug_reports enable row level security;

revoke all on public.profiles, public.day_records, public.bug_reports from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.day_records to authenticated;
grant select on public.bug_reports to authenticated;
-- Clients cannot set report status or creation time, edit a submitted report, or delete it.
grant insert (id, user_id, description, platform, locale, app_version)
  on public.bug_reports to authenticated;
grant all on public.profiles, public.day_records, public.bug_reports to service_role;

create policy profiles_owner on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy day_records_owner on public.day_records for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy bug_reports_insert_owner on public.bug_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy bug_reports_read_owner on public.bug_reports for select to authenticated
  using ((select auth.uid()) = user_id);

commit;
