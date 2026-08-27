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

/** TODO(clinical): same caveat as `KNOWN_DIAGNOSES` — a starting set, not a reviewed one. */
export const KNOWN_MEDICATIONS: PickOption[] = [
  { id: 'meclizine', labelKey: 'data.medication.meclizine' },
  { id: 'betahistine', labelKey: 'data.medication.betahistine' },
  { id: 'dimenhydrinate', labelKey: 'data.medication.dimenhydrinate' },
  { id: 'diazepam', labelKey: 'data.medication.diazepam' },
  { id: 'prochlorperazine', labelKey: 'data.medication.prochlorperazine' },
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
