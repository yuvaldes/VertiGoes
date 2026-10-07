-- Accept structured daily mood check-ins while retaining legacy good/bad values.
create or replace function vertigoes_private.valid_day_record(value jsonb, expected_date date)
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
  item := value -> 'feeling';
  if item not in ('null'::jsonb, '"good"'::jsonb, '"bad"'::jsonb) then
    if jsonb_typeof(item) is distinct from 'object'
      or not (item ?& array['score','tags','note','voiceUri'])
      or item - array['score','tags','note','voiceUri'] <> '{}'::jsonb
      or jsonb_typeof(item -> 'score') is distinct from 'number'
      or (item ->> 'score')::integer not between 1 and 5
      or not vertigoes_private.valid_choices(item -> 'tags', array['calm','anxious','sad','frustrated','tired','lonely','hopeful'])
      or not vertigoes_private.bounded_text(item -> 'note', 500)
      or (item -> 'voiceUri' <> 'null'::jsonb and not vertigoes_private.bounded_text(item -> 'voiceUri', 2000, 1))
    then return false; end if;
  end if;
  if value -> 'exercisePlan' not in ('"once"'::jsonb, '"thrice"'::jsonb) then return false; end if;
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
