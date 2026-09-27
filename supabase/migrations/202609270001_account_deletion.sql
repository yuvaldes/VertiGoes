begin;

-- Retain non-identifying operational history, but remove the account link and free text.
alter table public.bug_reports alter column user_id drop not null;
alter table public.bug_reports add column anonymized_at timestamptz;
alter table public.bug_reports drop constraint bug_reports_user_id_fkey;
alter table public.bug_reports add constraint bug_reports_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

create function vertigoes_private.anonymize_reports_before_account_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.bug_reports
  set user_id = null,
      description = '[removed when account was deleted]',
      anonymized_at = statement_timestamp()
  where user_id = old.id;
  return old;
end;
$$;

create trigger anonymize_reports_before_account_delete
  before delete on auth.users
  for each row execute function vertigoes_private.anonymize_reports_before_account_delete();

revoke all on function vertigoes_private.anonymize_reports_before_account_delete()
  from public, anon, authenticated;

commit;
