begin;

-- The identity-to-health mapping is intentionally separate from all clinical records. Health
-- tables use this random subject ID, never an email address or the auth user ID.
create table public.health_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default statement_timestamp()
);

create function vertigoes_private.owns_health_subject(subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.health_subjects where id = subject_id and user_id = auth.uid())
$$;
revoke all on function vertigoes_private.owns_health_subject(uuid) from public, anon;
grant execute on function vertigoes_private.owns_health_subject(uuid) to authenticated;

create table public.account_metadata (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 100),
  acquisition_source text check (char_length(acquisition_source) <= 100),
  registered_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','health_data_processing','ai_processing','research','marketing')),
  accepted boolean not null,
  document_version text not null check (document_version ~ '^[0-9]+\.[0-9]+$'),
  occurred_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);

create table public.health_profiles (
  subject_id uuid primary key references public.health_subjects(id) on delete cascade,
  -- Never store a birth date or street address: use these coarse values only.
  age_group text check (age_group in ('18_24','25_34','35_44','45_54','55_64','65_plus')),
  gender text check (gender in ('female','male','other','prefer_not_to_say')),
  locality text check (char_length(locality) <= 100),
  health_fund text check (char_length(health_fund) <= 100),
  diagnosis jsonb not null default '{}'::jsonb check (jsonb_typeof(diagnosis) = 'object'),
  contraindications jsonb not null default '{}'::jsonb check (jsonb_typeof(contraindications) = 'object'),
  recorded_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);

create table public.triage_sessions (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'), outcome text not null,
  red_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(red_flags) = 'array'),
  tree_version text not null, occurred_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.episode_logs (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  started_at timestamptz not null, duration_minutes integer check (duration_minutes between 0 and 10080),
  intensity smallint check (intensity between 0 and 10), symptoms jsonb not null default '[]'::jsonb check (jsonb_typeof(symptoms) = 'array'),
  trigger text check (char_length(trigger) <= 500), action_taken text check (char_length(action_taken) <= 1000),
  fall_occurred boolean, work_absence boolean, recorded_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.daily_checkins (
  subject_id uuid not null references public.health_subjects(id) on delete cascade, checkin_date date not null,
  dizziness smallint check (dizziness between 0 and 10), sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
  stress smallint check (stress between 0 and 10), mood smallint check (mood between 0 and 10),
  recorded_at timestamptz not null default statement_timestamp(), app_version text not null check (char_length(app_version) between 1 and 40),
  primary key (subject_id, checkin_date)
);
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) between 1 and 100), assigned_at timestamptz,
  completed_at timestamptz, completed boolean not null default false, dizziness_before smallint check (dizziness_before between 0 and 10),
  dizziness_after smallint check (dizziness_after between 0 and 10), helped boolean, posture_achieved boolean,
  recorded_at timestamptz not null default statement_timestamp(), app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.sos_events (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  action text not null check (action in ('call_emergency','call_contact','dismissed')), stopped_at text check (char_length(stopped_at) <= 100),
  contact_alert_sent boolean not null default false, occurred_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  questionnaire_key text not null check (char_length(questionnaire_key) between 1 and 100), answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  score numeric, occurred_at timestamptz not null default statement_timestamp(), app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.healthcare_usage_surveys (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'), occurred_at timestamptz not null default statement_timestamp(),
  app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.app_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 1 and 100), properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  occurred_at timestamptz not null default statement_timestamp(), app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 12000), response text not null check (char_length(response) between 1 and 24000),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'), rating smallint check (rating between 1 and 5),
  occurred_at timestamptz not null default statement_timestamp(), app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.doctor_reports (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.health_subjects(id) on delete cascade,
  generated_at timestamptz not null default statement_timestamp(), shared_at timestamptz, app_version text not null check (char_length(app_version) between 1 and 40)
);
create table public.weather_snapshots (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references public.episode_logs(id) on delete cascade,
  locality text not null check (char_length(locality) between 1 and 100), data jsonb not null check (jsonb_typeof(data) = 'object'),
  observed_at timestamptz not null, app_version text not null check (char_length(app_version) between 1 and 40)
);

alter table public.health_subjects enable row level security;
alter table public.account_metadata enable row level security;
alter table public.consent_events enable row level security;
alter table public.health_profiles enable row level security;
alter table public.triage_sessions enable row level security;
alter table public.episode_logs enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.sos_events enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.healthcare_usage_surveys enable row level security;
alter table public.app_events enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.doctor_reports enable row level security;
alter table public.weather_snapshots enable row level security;

grant select, insert, update, delete on public.health_subjects, public.account_metadata, public.consent_events,
  public.health_profiles, public.triage_sessions, public.episode_logs, public.daily_checkins, public.exercise_logs,
  public.sos_events, public.questionnaire_responses, public.healthcare_usage_surveys, public.app_events,
  public.ai_conversations, public.doctor_reports, public.weather_snapshots to authenticated;
grant all on public.health_subjects, public.account_metadata, public.consent_events, public.health_profiles,
  public.triage_sessions, public.episode_logs, public.daily_checkins, public.exercise_logs, public.sos_events,
  public.questionnaire_responses, public.healthcare_usage_surveys, public.app_events, public.ai_conversations,
  public.doctor_reports, public.weather_snapshots to service_role;

create policy health_subject_owner on public.health_subjects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy account_metadata_owner on public.account_metadata for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy consent_events_owner on public.consent_events for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy app_events_owner on public.app_events for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy health_profiles_owner on public.health_profiles for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy triage_sessions_owner on public.triage_sessions for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy episode_logs_owner on public.episode_logs for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy daily_checkins_owner on public.daily_checkins for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy exercise_logs_owner on public.exercise_logs for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy sos_events_owner on public.sos_events for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy questionnaire_responses_owner on public.questionnaire_responses for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy healthcare_usage_surveys_owner on public.healthcare_usage_surveys for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy ai_conversations_owner on public.ai_conversations for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy doctor_reports_owner on public.doctor_reports for all to authenticated using (vertigoes_private.owns_health_subject(subject_id)) with check (vertigoes_private.owns_health_subject(subject_id));
create policy weather_snapshots_owner on public.weather_snapshots for all to authenticated using (exists (select 1 from public.episode_logs e where e.id = episode_id and vertigoes_private.owns_health_subject(e.subject_id))) with check (exists (select 1 from public.episode_logs e where e.id = episode_id and vertigoes_private.owns_health_subject(e.subject_id)));

-- AI content is stored only after the separate AI consent is current.
create function vertigoes_private.require_ai_processing_consent() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.health_subjects s join public.legal_consents c on c.user_id = s.user_id where s.id = new.subject_id and c.document_type = 'ai_processing' and c.document_version = '1.0') then
    raise exception using errcode = '42501', message = 'AI processing consent is required.';
  end if;
  return new;
end;
$$;
create trigger ai_conversations_require_consent before insert or update on public.ai_conversations for each row execute function vertigoes_private.require_ai_processing_consent();
revoke all on function vertigoes_private.require_ai_processing_consent() from public, anon, authenticated;

commit;
