begin;

alter table public.account_metadata add column if not exists language text
  check (language in ('en', 'he'));

create or replace function vertigoes_private.request_app_version()
returns text language sql stable set search_path = '' as $$
  select coalesce(
    nullif((coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ->> 'x-app-version'), ''),
    '1.0.0'
  )
$$;
revoke all on function vertigoes_private.request_app_version() from public, anon, authenticated;

create or replace function vertigoes_private.sync_profile_to_pilot()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  subject uuid;
  answer jsonb := coalesce(new.answers, '{}'::jsonb);
  years integer;
  age_bucket text;
  display text;
  app text := vertigoes_private.request_app_version();
begin
  insert into public.health_subjects(user_id) values (new.id)
    on conflict (user_id) do nothing;
  select id into subject from public.health_subjects where user_id = new.id;

  display := nullif(trim(concat_ws(' ', answer->>'firstName', answer->>'lastName')), '');
  insert into public.account_metadata(user_id, display_name, language, app_version)
    values (new.id, display, nullif(answer->>'language', ''), app)
    on conflict (user_id) do update set
      display_name = excluded.display_name,
      language = excluded.language,
      app_version = excluded.app_version;

  if (answer->>'age') ~ '^[0-9]{1,3}$' then years := (answer->>'age')::integer; end if;
  age_bucket := case
    when years between 18 and 24 then '18_24'
    when years between 25 and 34 then '25_34'
    when years between 35 and 44 then '35_44'
    when years between 45 and 54 then '45_54'
    when years between 55 and 64 then '55_64'
    when years >= 65 then '65_plus'
    else null end;

  if new.answers is not null then
    insert into public.health_profiles(
      subject_id, age_group, gender, locality, health_fund, diagnosis,
      contraindications, recorded_at, app_version
    ) values (
      subject, age_bucket,
      case answer->>'gender' when 'woman' then 'female' when 'man' then 'male'
        when 'other' then 'other' else 'prefer_not_to_say' end,
      nullif(answer->>'locality', ''), nullif(answer->>'healthFund', ''),
      jsonb_build_object(
        'diagnosedBefore', answer->'diagnosedBefore', 'diagnoses', answer->'diagnoses',
        'otherDiagnosis', answer->'otherDiagnosis', 'medications', answer->'medications',
        'otherMedication', answer->'otherMedication', 'diagnosisAnswers', answer->'diagnosisAnswers',
        'manualDiagnosis', answer->'manualDiagnosis'
      ),
      coalesce(answer->'safetyAnswers', '{}'::jsonb), statement_timestamp(), app
    ) on conflict (subject_id) do update set
      age_group = excluded.age_group, gender = excluded.gender,
      locality = excluded.locality, health_fund = excluded.health_fund,
      diagnosis = excluded.diagnosis, contraindications = excluded.contraindications,
      recorded_at = excluded.recorded_at, app_version = excluded.app_version;
  end if;
  return new;
end;
$$;
revoke all on function vertigoes_private.sync_profile_to_pilot() from public, anon, authenticated;
drop trigger if exists profiles_sync_active_pilot on public.profiles;
create trigger profiles_sync_active_pilot after insert or update of answers on public.profiles
for each row execute function vertigoes_private.sync_profile_to_pilot();

create or replace function vertigoes_private.sync_day_record_to_checkin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare subject uuid; mood_score smallint; app text := vertigoes_private.request_app_version();
begin
  insert into public.health_subjects(user_id) values (new.user_id) on conflict (user_id) do nothing;
  select id into subject from public.health_subjects where user_id = new.user_id;
  mood_score := case jsonb_typeof(new.record->'feeling')
    when 'object' then nullif(new.record->'feeling'->>'score', '')::smallint
    when 'string' then case new.record->>'feeling' when 'good' then 4 when 'bad' then 2 end
    else null end;
  insert into public.daily_checkins(subject_id, checkin_date, sleep_hours, mood, recorded_at, app_version)
  values (subject, new.record_date, nullif(new.record->>'sleepHours', '')::numeric, mood_score,
    statement_timestamp(), app)
  on conflict (subject_id, checkin_date) do update set
    sleep_hours = excluded.sleep_hours, mood = excluded.mood,
    recorded_at = excluded.recorded_at, app_version = excluded.app_version;
  return new;
end;
$$;
revoke all on function vertigoes_private.sync_day_record_to_checkin() from public, anon, authenticated;
drop trigger if exists day_records_sync_active_pilot on public.day_records;
create trigger day_records_sync_active_pilot after insert or update of record on public.day_records
for each row execute function vertigoes_private.sync_day_record_to_checkin();

create or replace function public.record_consent_choices(
  choices jsonb, document_version text default '1.0', app_version text default '1.0.0'
) returns void language plpgsql security definer set search_path = '' as $$
declare consent_name text; accepted boolean;
begin
  if auth.uid() is null or jsonb_typeof(choices) <> 'object' then raise exception using errcode = '22023'; end if;
  for consent_name, accepted in
    select key, value::text::boolean from jsonb_each(choices)
  loop
    if consent_name not in ('terms','privacy','health_data_processing','ai_processing','research','marketing') then
      raise exception using errcode = '22023';
    end if;
    insert into public.consent_events(user_id, consent_type, accepted, document_version, app_version)
      values (auth.uid(), consent_name, accepted, document_version, app_version);
    if accepted then
      insert into public.legal_consents(user_id, document_type, document_version)
        values (auth.uid(), consent_name, document_version) on conflict do nothing;
    else
      delete from public.legal_consents where user_id = auth.uid()
        and document_type = consent_name and public.legal_consents.document_version = record_consent_choices.document_version;
    end if;
  end loop;
end;
$$;
revoke all on function public.record_consent_choices(jsonb,text,text) from public, anon;
grant execute on function public.record_consent_choices(jsonb,text,text) to authenticated;

create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = '' as $$
  with me as (select auth.uid() user_id), subject as (
    select s.id from public.health_subjects s, me where s.user_id = me.user_id
  ) select jsonb_build_object(
    'account', (select to_jsonb(a) from public.account_metadata a, me where a.user_id = me.user_id),
    'profile', (select to_jsonb(p) from public.profiles p, me where p.id = me.user_id),
    'consents', coalesce((select jsonb_agg(to_jsonb(c) order by c.occurred_at) from public.consent_events c, me where c.user_id = me.user_id), '[]'::jsonb),
    'healthProfile', (select to_jsonb(h) - 'subject_id' from public.health_profiles h, subject s where h.subject_id = s.id),
    'dailyCheckins', coalesce((select jsonb_agg(to_jsonb(d) - 'subject_id' order by d.checkin_date) from public.daily_checkins d, subject s where d.subject_id = s.id), '[]'::jsonb),
    'dayRecords', coalesce((select jsonb_agg(to_jsonb(d) order by d.record_date) from public.day_records d, me where d.user_id = me.user_id), '[]'::jsonb),
    'bugReports', coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at) from public.bug_reports b, me where b.user_id = me.user_id), '[]'::jsonb)
  ) from me
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Populate the normalized pilot tables for existing users and records.
insert into public.health_subjects(user_id)
select id from public.profiles on conflict (user_id) do nothing;
insert into public.health_subjects(user_id)
select distinct user_id from public.day_records on conflict (user_id) do nothing;

insert into public.account_metadata(user_id, display_name, language, app_version)
select p.id,
  nullif(trim(concat_ws(' ', p.answers->>'firstName', p.answers->>'lastName')), ''),
  nullif(p.answers->>'language', ''), '1.0.0'
from public.profiles p where p.answers is not null
on conflict (user_id) do update set display_name = excluded.display_name,
  language = excluded.language, app_version = excluded.app_version;

insert into public.health_profiles(subject_id, age_group, gender, diagnosis, contraindications, app_version)
select s.id,
  case when (p.answers->>'age') ~ '^[0-9]{1,3}$' then
    case when (p.answers->>'age')::integer between 18 and 24 then '18_24'
      when (p.answers->>'age')::integer between 25 and 34 then '25_34'
      when (p.answers->>'age')::integer between 35 and 44 then '35_44'
      when (p.answers->>'age')::integer between 45 and 54 then '45_54'
      when (p.answers->>'age')::integer between 55 and 64 then '55_64'
      when (p.answers->>'age')::integer >= 65 then '65_plus' end end,
  case p.answers->>'gender' when 'woman' then 'female' when 'man' then 'male'
    when 'other' then 'other' else 'prefer_not_to_say' end,
  jsonb_build_object(
    'diagnosedBefore', p.answers->'diagnosedBefore', 'diagnoses', p.answers->'diagnoses',
    'otherDiagnosis', p.answers->'otherDiagnosis', 'medications', p.answers->'medications',
    'otherMedication', p.answers->'otherMedication', 'diagnosisAnswers', p.answers->'diagnosisAnswers',
    'manualDiagnosis', p.answers->'manualDiagnosis'
  ), coalesce(p.answers->'safetyAnswers', '{}'::jsonb), '1.0.0'
from public.profiles p join public.health_subjects s on s.user_id = p.id
where p.answers is not null
on conflict (subject_id) do update set age_group = excluded.age_group,
  gender = excluded.gender, diagnosis = excluded.diagnosis,
  contraindications = excluded.contraindications, recorded_at = statement_timestamp(),
  app_version = excluded.app_version;

insert into public.daily_checkins(subject_id, checkin_date, sleep_hours, mood, app_version)
select s.id, d.record_date, nullif(d.record->>'sleepHours', '')::numeric,
  case jsonb_typeof(d.record->'feeling')
    when 'object' then nullif(d.record->'feeling'->>'score', '')::smallint
    when 'string' then case d.record->>'feeling' when 'good' then 4 when 'bad' then 2 end
  end, '1.0.0'
from public.day_records d join public.health_subjects s on s.user_id = d.user_id
on conflict (subject_id, checkin_date) do update set sleep_hours = excluded.sleep_hours,
  mood = excluded.mood, recorded_at = statement_timestamp(), app_version = excluded.app_version;
insert into public.consent_events(user_id, consent_type, accepted, document_version, occurred_at, app_version)
select user_id, document_type, true, document_version, accepted_at, '1.0.0'
from public.legal_consents c
where not exists (
  select 1 from public.consent_events e where e.user_id = c.user_id
    and e.consent_type = c.document_type and e.document_version = c.document_version
);

commit;
