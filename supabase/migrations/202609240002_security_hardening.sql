begin;

-- Additive migration: keep existing records and the owner-only RLS policies intact.
-- Validators apply to future inserts/updates; inspect legacy data before enabling public signup.
create schema if not exists vertigoes_private;
revoke all on schema vertigoes_private from public, anon, authenticated;

create function vertigoes_private.bounded_text(value jsonb, max_length integer, min_length integer default 0)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(value) = 'string'
    and char_length(value #>> '{}') between min_length and max_length, false);
$$;

create function vertigoes_private.valid_choices(value jsonb, allowed text[])
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if jsonb_typeof(value) is distinct from 'array' then return false; end if;
  if jsonb_array_length(value) > cardinality(allowed) then return false; end if;
  for item in select v from jsonb_array_elements(value) as a(v) loop
    if jsonb_typeof(item) is distinct from 'string' or not ((item #>> '{}') = any(allowed)) then
      return false;
    end if;
  end loop;
  if (select count(distinct v) from jsonb_array_elements(value) as a(v)) <> jsonb_array_length(value) then
    return false;
  end if;
  return not (value ? 'none' and jsonb_array_length(value) > 1);
end;
$$;

create function vertigoes_private.valid_profile_answers(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  field text;
  item jsonb;
  fields constant text[] := array['firstName','lastName','age','gender','language',
    'diagnosedBefore','diagnoses','otherDiagnosis','medications','otherMedication',
    'diagnosisAnswers','manualDiagnosis','emergencyContactName','emergencyContactPhone'];
begin
  if value is null or jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if octet_length(value::text) > 16384 or not (value ?& fields) or value - fields <> '{}'::jsonb then
    return false;
  end if;
  foreach field in array array['firstName','lastName','emergencyContactName'] loop
    if not vertigoes_private.bounded_text(value -> field, 100) then return false; end if;
  end loop;
  if not vertigoes_private.bounded_text(value -> 'age', 3, 1) then return false; end if;
  if (value ->> 'age') !~ '^[0-9]{1,3}$' then return false; end if;
  if (value ->> 'age')::integer not between 1 and 130 then return false; end if;
  if (value -> 'gender') not in ('null'::jsonb, '"female"'::jsonb, '"male"'::jsonb, '"other"'::jsonb)
    or (value -> 'language') not in ('"en"'::jsonb, '"he"'::jsonb)
    or jsonb_typeof(value -> 'diagnosedBefore') not in ('boolean', 'null') then return false; end if;
  if not vertigoes_private.bounded_text(value -> 'otherDiagnosis', 1000)
    or not vertigoes_private.bounded_text(value -> 'otherMedication', 1000)
    or not vertigoes_private.bounded_text(value -> 'manualDiagnosis', 2000)
    or not vertigoes_private.bounded_text(value -> 'emergencyContactPhone', 40) then return false; end if;
  if not vertigoes_private.valid_choices(value -> 'diagnoses', array[
    'bppv','menieres','vestibular-migraine','vestibular-neuritis','pppd','central-vertigo','none','other'])
    or not vertigoes_private.valid_choices(value -> 'medications', array[
      'meclizine','dimenhydrinate','cinnarizineDimenhydrinate','prochlorperazine','ondansetron',
      'diazepamLorazepam','scopolamine','betahistine','hydrochlorothiazideTriamterene',
      'acetazolamide','dexamethasoneIT','gentamicinIT','amitriptylineNortriptyline','topiramate',
      'propranololMetoprolol','venlafaxine','flunarizineVerapamil','cgrpAntagonists',
      'sertraline','escitalopram','duloxetine','prednisoneMethylprednisolone','none','other']) then
    return false;
  end if;
  if jsonb_typeof(value -> 'diagnosisAnswers') is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(value -> 'diagnosisAnswers')) > 32 then return false; end if;
  for field, item in select key, v from jsonb_each(value -> 'diagnosisAnswers') as a(key,v) loop
    if char_length(field) not between 1 and 64 or jsonb_typeof(item) not in ('boolean','null') then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create function vertigoes_private.valid_day_record(value jsonb, expected_date date)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  slot text;
  item jsonb;
  fields constant text[] := array['date','episodes','emergencyCall','inAppHelp','sleepHours',
    'feeling','exercisePlan','exercises','liv'];
begin
  if value is null or jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if octet_length(value::text) > 16384 or not (value ?& fields) or value - fields <> '{}'::jsonb then
    return false;
  end if;
  if not vertigoes_private.bounded_text(value -> 'date', 10, 10)
    or value ->> 'date' <> to_char(expected_date, 'YYYY-MM-DD')
    or expected_date not between date '1900-01-01' and date '2100-12-31' then return false; end if;
  if jsonb_typeof(value -> 'episodes') is distinct from 'number' then return false; end if;
  if (value ->> 'episodes')::numeric not between 0 and 1000
    or mod((value ->> 'episodes')::numeric, 1) <> 0 then return false; end if;
  if jsonb_typeof(value -> 'emergencyCall') is distinct from 'boolean' then return false; end if;
  if value -> 'sleepHours' <> 'null'::jsonb then
    if jsonb_typeof(value -> 'sleepHours') is distinct from 'number' then return false; end if;
    if (value ->> 'sleepHours')::numeric not between 0 and 24 then return false; end if;
  end if;
  if value -> 'feeling' not in ('null'::jsonb, '"good"'::jsonb, '"bad"'::jsonb)
    or value -> 'exercisePlan' not in ('"once"'::jsonb, '"thrice"'::jsonb) then return false; end if;
  if jsonb_typeof(value -> 'exercises') is distinct from 'object' then return false; end if;
  for slot, item in select key, v from jsonb_each(value -> 'exercises') as a(key,v) loop
    if slot not in ('morning','midday','evening') or jsonb_typeof(item) is distinct from 'object' then
      return false;
    end if;
    if not (item ?& array['done','total']) or item - array['done','total'] <> '{}'::jsonb then return false; end if;
    if jsonb_typeof(item -> 'done') is distinct from 'number'
      or jsonb_typeof(item -> 'total') is distinct from 'number' then return false; end if;
    if (item ->> 'total')::numeric not between 0 and 1000
      or (item ->> 'done')::numeric not between 0 and (item ->> 'total')::numeric
      or mod((item ->> 'done')::numeric, 1) <> 0 or mod((item ->> 'total')::numeric, 1) <> 0 then return false; end if;
  end loop;
  item := value -> 'liv';
  if item <> 'null'::jsonb then
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if item - 'summary' <> '{}'::jsonb or not vertigoes_private.bounded_text(item -> 'summary', 4000) then return false; end if;
  end if;
  item := value -> 'inAppHelp';
  if item <> 'null'::jsonb then
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if item - 'answers' <> '{}'::jsonb or jsonb_typeof(item -> 'answers') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item -> 'answers') > 64 then return false; end if;
    for item in select v from jsonb_array_elements(value -> 'inAppHelp' -> 'answers') as a(v) loop
      if jsonb_typeof(item) is distinct from 'object' then return false; end if;
      if item - array['questionId','optionIndex'] <> '{}'::jsonb
        or not vertigoes_private.bounded_text(item -> 'questionId', 64, 1)
        or jsonb_typeof(item -> 'optionIndex') is distinct from 'number' then return false; end if;
      if (item ->> 'optionIndex')::numeric not between 0 and 15
        or mod((item ->> 'optionIndex')::numeric, 1) <> 0 then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;

create function vertigoes_private.validate_health_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'profiles' then
    if new.answers is not null and not vertigoes_private.valid_profile_answers(new.answers) then
      raise exception using errcode = '22023', message = 'Invalid profile answers.';
    end if;
  elsif tg_table_name = 'day_records' then
    if not vertigoes_private.valid_day_record(new.record, new.record_date) then
      raise exception using errcode = '22023', message = 'Invalid day record.';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_validate_health before insert or update on public.profiles
  for each row execute function vertigoes_private.validate_health_write();
create trigger day_records_validate_health before insert or update on public.day_records
  for each row execute function vertigoes_private.validate_health_write();

-- At most three small counter rows per account. Clients cannot reset them by deleting
-- their profile, changing a timestamp, calling an RPC, or writing directly to this schema.
create table vertigoes_private.write_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource text not null check (resource in ('profiles','day_records','bug_reports')),
  short_window timestamptz not null,
  day_window date not null,
  short_count integer not null,
  day_count integer not null,
  primary key (user_id, resource)
);
alter table vertigoes_private.write_limits enable row level security;
revoke all on vertigoes_private.write_limits from public, anon, authenticated;

create function vertigoes_private.enforce_write_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  owner_id uuid;
  short_cap integer;
  day_cap integer;
  current_window timestamptz;
  current_day date := (statement_timestamp() at time zone 'UTC')::date;
  accepted boolean;
begin
  -- Trusted administrative writes without a user JWT remain possible. Client roles
  -- never get this bypass, even if an unexpected caller supplies a missing identity.
  if actor is null then
    if current_setting('role', true) in ('anon','authenticated') then
      raise exception using errcode = '42501', message = 'Sign in required.';
    end if;
    return new;
  end if;
  if tg_table_name = 'profiles' then owner_id := new.id; else owner_id := new.user_id; end if;
  if owner_id is distinct from actor then
    raise exception using errcode = '42501', message = 'Account mismatch.';
  end if;
  case tg_table_name
    when 'bug_reports' then short_cap := 5; day_cap := 20;
      current_window := date_trunc('hour', statement_timestamp(), 'UTC');
    when 'profiles' then short_cap := 20; day_cap := 100;
      current_window := date_trunc('minute', statement_timestamp(), 'UTC');
    when 'day_records' then short_cap := 120; day_cap := 1000;
      current_window := date_trunc('minute', statement_timestamp(), 'UTC');
    else raise exception 'Unexpected quota resource';
  end case;

  -- ON CONFLICT locks and updates one counter row atomically: concurrent requests cannot
  -- both observe spare capacity and overrun it. Multi-row requests are counted per row.
  insert into vertigoes_private.write_limits as limits
    (user_id, resource, short_window, day_window, short_count, day_count)
    values (actor, tg_table_name, current_window, current_day, 1, 1)
  on conflict (user_id, resource) do update set
    -- A statement that waited on a lock across a window boundary must not move
    -- the counters backwards and replenish a newer window's quota.
    short_window = greatest(limits.short_window, excluded.short_window),
    day_window = greatest(limits.day_window, excluded.day_window),
    short_count = case when limits.short_window >= excluded.short_window then limits.short_count + 1 else 1 end,
    day_count = case when limits.day_window >= excluded.day_window then limits.day_count + 1 else 1 end
  where (limits.short_window < excluded.short_window or limits.short_count < short_cap)
    and (limits.day_window < excluded.day_window or limits.day_count < day_cap)
  returning true into accepted;
  if accepted is distinct from true then
    raise exception using errcode = 'PT429', message = 'Write limit reached. Please try again later.';
  end if;
  return new;
end;
$$;

-- AFTER triggers count successful upserts once, rather than charging both their
-- attempted INSERT and their UPDATE. Rejected statements roll back their counters too.
create trigger profiles_write_limit after insert or update on public.profiles
  for each row execute function vertigoes_private.enforce_write_limit();
create trigger day_records_write_limit after insert or update on public.day_records
  for each row execute function vertigoes_private.enforce_write_limit();
create trigger bug_reports_write_limit after insert on public.bug_reports
  for each row execute function vertigoes_private.enforce_write_limit();

revoke all on all functions in schema vertigoes_private from public, anon, authenticated;

commit;
