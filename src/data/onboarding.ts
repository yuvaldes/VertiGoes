import type { TKey } from '../i18n';
import type { Language } from '../state/PreferencesContext';

export type Gender = 'female' | 'male' | 'other';

export const GENDER_OPTIONS: { id: Gender; labelKey: TKey }[] = [
  { id: 'female', labelKey: 'data.gender.female' },
  { id: 'male', labelKey: 'data.gender.male' },
  { id: 'other', labelKey: 'data.gender.other' },
];

/**
 * Endonyms — a language names itself the same way in every locale — so these point at the
 * shared `common.language.*` keys rather than getting a second copy under `data`.
 */
export const LANGUAGE_OPTIONS: { id: Language; labelKey: TKey }[] = [
  { id: 'he', labelKey: 'common.language.he' },
  { id: 'en', labelKey: 'common.language.en' },
];

/** A chip in a multi-select list — a real condition or medication, or one of the two below. */
export type PickOption = { id: string; labelKey: TKey };

/** Own toggles rather than list entries, so they can be made exclusive of the real options. */
export const NONE_OPTION_ID = 'none';
export const OTHER_OPTION_ID = 'other';

/**
 * TODO(clinical): this list has not been reviewed by a clinician — it is a reasonable starting
 * set for BPPV/vestibular triage, not a verified diagnosis list. Replace before this ships to a
 * real user, same caveat as `src/data/helpFlow.ts`.
 */
export const KNOWN_DIAGNOSES: PickOption[] = [
  { id: 'bppv', labelKey: 'data.diagnosis.bppv' },
  { id: 'menieres', labelKey: 'data.diagnosis.menieres' },
  { id: 'vestibular-migraine', labelKey: 'data.diagnosis.vestibularMigraine' },
  { id: 'vestibular-neuritis', labelKey: 'data.diagnosis.vestibularNeuritis' },
  { id: 'pppd', labelKey: 'data.diagnosis.pppd' },
  { id: 'central-vertigo', labelKey: 'data.diagnosis.centralVertigo' },
];

/**
 * Sourced from a clinician-supplied reference table (acute symptomatic relief, Meniere's,
 * migraine prophylaxis, PPPD, and vestibular neuritis/labyrinthitis), unlike `KNOWN_DIAGNOSES`
 * above — this list is not a starting guess. A row that named two interchangeable drugs in the
 * reference (e.g. "Diazepam / Lorazepam") stays combined here rather than being split, since
 * the source presented them as one choice.
 */
export const KNOWN_MEDICATIONS: PickOption[] = [
  { id: 'meclizine', labelKey: 'data.medication.meclizine' },
  { id: 'dimenhydrinate', labelKey: 'data.medication.dimenhydrinate' },
  { id: 'cinnarizineDimenhydrinate', labelKey: 'data.medication.cinnarizineDimenhydrinate' },
  { id: 'prochlorperazine', labelKey: 'data.medication.prochlorperazine' },
  { id: 'ondansetron', labelKey: 'data.medication.ondansetron' },
  { id: 'diazepamLorazepam', labelKey: 'data.medication.diazepamLorazepam' },
  { id: 'scopolamine', labelKey: 'data.medication.scopolamine' },
  { id: 'betahistine', labelKey: 'data.medication.betahistine' },
  {
    id: 'hydrochlorothiazideTriamterene',
    labelKey: 'data.medication.hydrochlorothiazideTriamterene',
  },
  { id: 'acetazolamide', labelKey: 'data.medication.acetazolamide' },
  { id: 'dexamethasoneIT', labelKey: 'data.medication.dexamethasoneIT' },
  { id: 'gentamicinIT', labelKey: 'data.medication.gentamicinIT' },
  { id: 'amitriptylineNortriptyline', labelKey: 'data.medication.amitriptylineNortriptyline' },
  { id: 'topiramate', labelKey: 'data.medication.topiramate' },
  { id: 'propranololMetoprolol', labelKey: 'data.medication.propranololMetoprolol' },
  { id: 'venlafaxine', labelKey: 'data.medication.venlafaxine' },
  { id: 'flunarizineVerapamil', labelKey: 'data.medication.flunarizineVerapamil' },
  { id: 'cgrpAntagonists', labelKey: 'data.medication.cgrpAntagonists' },
  { id: 'sertraline', labelKey: 'data.medication.sertraline' },
  { id: 'escitalopram', labelKey: 'data.medication.escitalopram' },
  { id: 'duloxetine', labelKey: 'data.medication.duloxetine' },
  {
    id: 'prednisoneMethylprednisolone',
    labelKey: 'data.medication.prednisoneMethylprednisolone',
  },
];

export type DiagnosisQuestion = { id: string; textKey: TKey };

/**
 * TODO(content): no question set has been provided yet — this is intentionally empty.
 * `OnboardingDiagnosisStep` already renders whatever lands here as a list of optional yes/no
 * toggles, and shows a "nothing to ask yet" state when it's empty, so dropping real questions
 * into this array is the only change needed once you have them.
 */
export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [];

export type OnboardingAnswers = {
  firstName: string;
  lastName: string;
  age: string;
  gender: Gender | null;
  language: Language;

  diagnosedBefore: boolean | null;
  diagnoses: string[];
  otherDiagnosis: string;

  medications: string[];
  otherMedication: string;

  /** `null` means not yet answered, distinct from `false`. */
  diagnosisAnswers: Record<string, boolean | null>;
  /** Free text, for when there's no question set yet or the questions didn't cover it. */
  manualDiagnosis: string;

  emergencyContactName: string;
  emergencyContactPhone: string;
};

export const initialOnboardingAnswers: OnboardingAnswers = {
  firstName: '',
  lastName: '',
  age: '',
  gender: null,
  language: 'he',

  diagnosedBefore: null,
  diagnoses: [],
  otherDiagnosis: '',

  medications: [],
  otherMedication: '',

  diagnosisAnswers: {},
  manualDiagnosis: '',

  emergencyContactName: '',
  emergencyContactPhone: '',
};

/** Basic info, medical history, diagnosis questions, emergency contact. */
export const ONBOARDING_STEP_COUNT = 4;

/**
 * How far through the wizard a skipped run got, as a whole percentage — shown on the Menu's
 * "Personal information" row so a visitor can see they left off partway rather than at zero.
 * `step` is the index they were on when they backed out, so completed steps are the ones
 * before it; `null` (never opened, or already finished) reads as 0.
 */
export function onboardingPercent(step: number | null): number {
  if (step === null) return 0;
  return Math.round((step / ONBOARDING_STEP_COUNT) * 100);
}
