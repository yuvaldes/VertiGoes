/**
 * The in-app help flow: a short yes/no triage the user answers during an episode.
 *
 * The questions are data so the set can be changed — or localised — without touching the
 * screen that asks them.
 *
 * TODO(clinical): this draft is plausible for BPPV but has NOT been reviewed by a clinician.
 * It must be before it reaches a real user, particularly the red-flag question.
 */

import { t, type Locale, type TKey } from '../i18n';

export type HelpQuestion = {
  id: string;
  textKey: TKey;
  /**
   * A yes here is a reason to seek medical help rather than to carry on self-managing, so the
   * closing step routes to the emergency contact instead of to breathing guidance.
   */
  redFlag?: boolean;
};

/**
 * A recorded answer refers to its question by id, not by the words that were on screen.
 * A saved session outlives the language it was answered in, and the day-detail screen has to be
 * able to show it in whichever language the reader is using now.
 */
export type HelpAnswer = { questionId: string; answer: boolean };

export const HELP_QUESTIONS: HelpQuestion[] = [
  { id: 'spinning-now', textKey: 'data.help.questionSpinningNow' },
  { id: 'head-position', textKey: 'data.help.questionHeadPosition' },
  { id: 'can-sit', textKey: 'data.help.questionCanSit' },
  { id: 'worse-than-usual', textKey: 'data.help.questionWorseThanUsual' },
  {
    id: 'red-flags',
    textKey: 'data.help.questionRedFlags',
    redFlag: true,
  },
];

/** For rendering a stored answer: the question it was an answer to, if the set still has it. */
export function helpQuestionById(id: string): HelpQuestion | undefined {
  return HELP_QUESTIONS.find((question) => question.id === id);
}

const byId = (answers: HelpAnswer[], id: string) =>
  answers.find((answer) => answer.questionId === id)?.answer;

/** True when any red-flag question was answered yes. */
export function hasRedFlag(answers: HelpAnswer[]): boolean {
  return HELP_QUESTIONS.filter((q) => q.redFlag).some((q) => byId(answers, q.id) === true);
}

export type HelpGuidance = {
  urgent: boolean;
  titleKey: TKey;
  stepKeys: TKey[];
};

/** What to tell the user once the questions are answered. */
export function guidanceFor(answers: HelpAnswer[]): HelpGuidance {
  if (hasRedFlag(answers)) {
    return {
      urgent: true,
      titleKey: 'data.help.urgentTitle',
      stepKeys: [
        'data.help.urgentStepCauses',
        'data.help.urgentStepCall',
        'data.help.urgentStepEscalate',
      ],
    };
  }

  const canSit = byId(answers, 'can-sit');
  const stepKeys: TKey[] = [
    canSit === false ? 'data.help.stepSteady' : 'data.help.stepSit',
    'data.help.stepFixEyes',
    'data.help.stepBreathe',
    'data.help.stepMoveSlowly',
  ];

  if (byId(answers, 'worse-than-usual') === true) {
    stepKeys.push('data.help.stepMentionDoctor');
  }

  return { urgent: false, titleKey: 'data.help.calmTitle', stepKeys };
}

/**
 * A full sentence describing the session, appended to the day's calendar summary.
 *
 * A sentence rather than a fragment because it is joined with the Liv conversation summary,
 * which is also a sentence — gluing fragments onto it read awkwardly. That join is why this
 * resolves text here instead of returning a key: the caller is building one string out of two.
 */
export function describeHelpSession(locale: Locale, answers: HelpAnswer[]): string {
  if (answers.length === 0) return t(locale, 'data.help.summaryPlain');
  if (hasRedFlag(answers)) return t(locale, 'data.help.summaryRedFlag');

  const positional = byId(answers, 'head-position') === true;
  const worse = byId(answers, 'worse-than-usual') === true;

  if (positional && worse) return t(locale, 'data.help.summaryPositionalWorse');
  if (positional) return t(locale, 'data.help.summaryPositional');
  if (worse) return t(locale, 'data.help.summaryWorse');
  return t(locale, 'data.help.summaryEpisode');
}
