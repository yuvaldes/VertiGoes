begin;

create table public.legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  document_type text not null check (document_type in ('medical_disclaimer', 'health_data_processing')),
  document_version text not null check (document_version ~ '^[0-9]+\.[0-9]+$'),
  accepted_at timestamptz not null default statement_timestamp(),
  unique (user_id, document_type, document_version)
);
create index legal_consents_user_id_idx on public.legal_consents(user_id);

comment on table public.legal_consents is
  'Append-only record of explicit legal acceptance. Rows survive account deletion with user_id anonymised.';

alter table public.legal_consents enable row level security;
revoke all on public.legal_consents from public, anon, authenticated;
grant select on public.legal_consents to authenticated;
grant insert (user_id, document_type, document_version) on public.legal_consents to authenticated;
grant all on public.legal_consents to service_role;

create policy legal_consents_read_owner on public.legal_consents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy legal_consents_insert_owner on public.legal_consents for insert to authenticated
  with check ((select auth.uid()) = user_id);

create function vertigoes_private.require_current_legal_consent()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then return new; end if;
  if not exists (
    select 1 from public.legal_consents
    where user_id = actor and document_type = 'medical_disclaimer' and document_version = '1.0'
  ) or not exists (
    select 1 from public.legal_consents
    where user_id = actor and document_type = 'health_data_processing' and document_version = '1.0'
  ) then
    raise exception using errcode = '42501', message = 'Current legal consent is required.';
  end if;
  return new;
end;
$$;

-- Empty account scaffolding is allowed. Health answers and diary records are not.
create trigger profiles_require_consent before insert or update of answers on public.profiles
  for each row when (new.answers is not null)
  execute function vertigoes_private.require_current_legal_consent();
create trigger day_records_require_consent before insert or update on public.day_records
  for each row execute function vertigoes_private.require_current_legal_consent();

revoke all on function vertigoes_private.require_current_legal_consent() from public, anon, authenticated;

commit;
