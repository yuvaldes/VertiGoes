begin;

-- Consent categories are deliberately explicit: optional categories get a row only when the
-- person opted in, so absence remains a meaningful refusal rather than an ambiguous false.
alter table public.legal_consents drop constraint legal_consents_document_type_check;
alter table public.legal_consents add constraint legal_consents_document_type_check
  check (document_type in ('medical_disclaimer', 'terms', 'privacy', 'health_data_processing', 'ai_processing', 'research', 'marketing'));

create or replace function vertigoes_private.valid_profile_answers(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare field text; item jsonb;
  fields constant text[] := array['firstName','lastName','age','gender','language','diagnosedBefore','diagnoses','otherDiagnosis','medications','otherMedication','diagnosisAnswers','manualDiagnosis','emergencyContactName','emergencyContactPhone','safetyAnswers'];
  safety_ids constant text[] := array['sudden_severe_headache','one_sided_weakness','speech_difficulty','double_vision','swallowing_difficulty','unable_to_walk','chest_pain_or_palpitations','recent_head_or_neck_injury','loss_of_consciousness','neck_or_back_problem','heart_or_blood_vessel_condition','recent_head_neck_back_or_eye_surgery','pregnancy'];
begin
  if value is null or jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if octet_length(value::text) > 16384 or not (value ?& fields) or value - fields <> '{}'::jsonb then return false; end if;
  foreach field in array array['firstName','lastName','emergencyContactName'] loop if not vertigoes_private.bounded_text(value -> field, 100) then return false; end if; end loop;
  if not vertigoes_private.bounded_text(value -> 'age', 3, 1) or (value ->> 'age') !~ '^[0-9]{1,3}$' or (value ->> 'age')::integer not between 18 and 130 then return false; end if;
  if (value -> 'gender') not in ('null'::jsonb, '"female"'::jsonb, '"male"'::jsonb, '"other"'::jsonb) or (value -> 'language') not in ('"en"'::jsonb, '"he"'::jsonb) or jsonb_typeof(value -> 'diagnosedBefore') not in ('boolean', 'null') then return false; end if;
  if not vertigoes_private.bounded_text(value -> 'otherDiagnosis', 1000) or not vertigoes_private.bounded_text(value -> 'otherMedication', 1000) or not vertigoes_private.bounded_text(value -> 'manualDiagnosis', 2000) or not vertigoes_private.bounded_text(value -> 'emergencyContactPhone', 40) then return false; end if;
  if not vertigoes_private.valid_choices(value -> 'diagnoses', array['bppv','menieres','vestibular-migraine','vestibular-neuritis','pppd','central-vertigo','none','other']) or not vertigoes_private.valid_choices(value -> 'medications', array['meclizine','dimenhydrinate','cinnarizineDimenhydrinate','prochlorperazine','ondansetron','diazepamLorazepam','scopolamine','betahistine','hydrochlorothiazideTriamterene','acetazolamide','dexamethasoneIT','gentamicinIT','amitriptylineNortriptyline','topiramate','propranololMetoprolol','venlafaxine','flunarizineVerapamil','cgrpAntagonists','sertraline','escitalopram','duloxetine','prednisoneMethylprednisolone','none','other']) then return false; end if;
  if jsonb_typeof(value -> 'diagnosisAnswers') is distinct from 'object' or (select count(*) from jsonb_object_keys(value -> 'diagnosisAnswers')) > 32 then return false; end if;
  for field, item in select key, v from jsonb_each(value -> 'diagnosisAnswers') as a(key,v) loop if char_length(field) not between 1 and 64 or jsonb_typeof(item) not in ('boolean','null') then return false; end if; end loop;
  if jsonb_typeof(value -> 'safetyAnswers') is distinct from 'object' or not ((value -> 'safetyAnswers') ?& safety_ids) or (value -> 'safetyAnswers') - safety_ids <> '{}'::jsonb then return false; end if;
  for field, item in select key, v from jsonb_each(value -> 'safetyAnswers') as a(key,v) loop if jsonb_typeof(item) not in ('boolean','null') then return false; end if; end loop;
  return true;
end;
$$;

create or replace function vertigoes_private.require_current_legal_consent()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then return new; end if;
  if exists (
    select 1 from unnest(array['terms', 'privacy', 'health_data_processing']) as required(document_type)
    where not exists (
      select 1 from public.legal_consents c
      where c.user_id = actor and c.document_type = required.document_type and c.document_version = '1.0'
    )
  ) then
    raise exception using errcode = '42501', message = 'Current legal consent is required.';
  end if;
  return new;
end;
$$;

commit;
