/**
 * The in-app triage flow, walked one question at a time during an episode.
 *
 * Modelled as a graph rather than a fixed list, because the questions genuinely branch: which
 * question comes next depends on the answer just given, and different paths ask different
 * numbers of questions before reaching an outcome. Sourced from the clinician-supplied
 * "VertiGoes Self-Triage Decision Tree (Mode B)" document — node ids below (Q0.1, Q2A,
 * DX-BPPV, ER, ...) match that document's own Node IDs, so the two can be cross-referenced.
 *
 * `Q0.1` through `Q0.9` are the safety gate: nine red-flag questions asked first, in order.
 * A "yes" to any one of them jumps straight to `ER` and the rest are never asked. All nine
 * "no" falls through to `Q1`, the root of the branching tree proper.
 */

import { t, type Locale, type TKey } from '../i18n';

export type HelpOption = {
  labelKey: TKey;
  /** The node this answer leads to — another question, or a terminal outcome. */
  next: string;
};

export type HelpQuestionNode = {
  kind: 'question';
  id: string;
  textKey: TKey;
  options: HelpOption[];
};

/**
 * `info` is a plain diagnosis suggestion. `urgent` is the doc's "yellow" tier — worth same-day
 * medical attention, but not a reason to stop the flow or dial the emergency contact. `emergency`
 * is `ER`: the flow stops completely and the emergency-contact button appears.
 */
export type HelpOutcomeSeverity = 'info' | 'urgent' | 'emergency';

export type HelpOutcomeNode = {
  kind: 'outcome';
  id: string;
  severity: HelpOutcomeSeverity;
  titleKey: TKey;
  noteKeys: TKey[];
};

export type HelpNode = HelpQuestionNode | HelpOutcomeNode;

/**
 * A recorded answer refers to its question and the option index chosen, not the words that
 * were on screen. A saved session outlives the language it was answered in, and the day-detail
 * screen has to be able to show it in whichever language the reader is using now.
 */
export type HelpAnswer = { questionId: string; optionIndex: number };

export const HELP_START = 'Q0.1';

const YES: TKey = 'common.answer.yes';
const NO: TKey = 'common.answer.no';

/** A Q0 safety-gate item: "yes" always escalates to `ER`, "no" moves to the next one. */
function gate(id: string, textKey: TKey, ifNo: string): HelpQuestionNode {
  return {
    kind: 'question',
    id,
    textKey,
    options: [
      { labelKey: YES, next: 'ER' },
      { labelKey: NO, next: ifNo },
    ],
  };
}

/** A plain yes/no question, for the two-option nodes below Q0. */
function yesNo(id: string, textKey: TKey, ifYes: string, ifNo: string): HelpQuestionNode {
  return {
    kind: 'question',
    id,
    textKey,
    options: [
      { labelKey: YES, next: ifYes },
      { labelKey: NO, next: ifNo },
    ],
  };
}

function outcome(
  id: string,
  severity: HelpOutcomeSeverity,
  titleKey: TKey,
  noteKeys: TKey[],
): HelpOutcomeNode {
  return { kind: 'outcome', id, severity, titleKey, noteKeys };
}

export const HELP_NODES: Record<string, HelpNode> = {
  // --- Q0: safety gate --------------------------------------------------------------------
  'Q0.1': gate('Q0.1', 'data.help.q0.headache', 'Q0.2'),
  'Q0.2': gate('Q0.2', 'data.help.q0.weakness', 'Q0.3'),
  'Q0.3': gate('Q0.3', 'data.help.q0.speech', 'Q0.4'),
  'Q0.4': gate('Q0.4', 'data.help.q0.doubleVision', 'Q0.5'),
  'Q0.5': gate('Q0.5', 'data.help.q0.swallowing', 'Q0.6'),
  'Q0.6': gate('Q0.6', 'data.help.q0.imbalance', 'Q0.7'),
  'Q0.7': gate('Q0.7', 'data.help.q0.chestPain', 'Q0.8'),
  'Q0.8': gate('Q0.8', 'data.help.q0.headInjury', 'Q0.9'),
  'Q0.9': gate('Q0.9', 'data.help.q0.consciousness', 'Q1'),

  // --- Q1: root of the branching tree ------------------------------------------------------
  Q1: {
    kind: 'question',
    id: 'Q1',
    textKey: 'data.help.q1.text',
    options: [
      { labelKey: 'data.help.q1.sudden', next: 'Q2A' },
      { labelKey: 'data.help.q1.gradual', next: 'Q2B' },
      { labelKey: 'data.help.q1.chronic', next: 'Q2C' },
    ],
  },

  // --- Branch A: sudden onset ---------------------------------------------------------------
  Q2A: {
    kind: 'question',
    id: 'Q2A',
    textKey: 'data.help.q2a.text',
    options: [
      { labelKey: 'data.help.q2a.positional', next: 'Q3-BPPV' },
      { labelKey: 'data.help.q2a.recurring', next: 'Q3-EPI' },
      { labelKey: 'data.help.q2a.continuous', next: 'Q3-CONT' },
    ],
  },
  'Q3-BPPV': yesNo('Q3-BPPV', 'data.help.q3bppv.text', 'Q4-EAR', 'Q3-EPI'),
  'Q4-EAR': {
    kind: 'question',
    id: 'Q4-EAR',
    textKey: 'data.help.q4ear.text',
    options: [
      { labelKey: 'data.help.q4ear.right', next: 'DX-BPPV' },
      { labelKey: 'data.help.q4ear.left', next: 'DX-BPPV' },
      { labelKey: 'data.help.q4ear.bilateral', next: 'DX-BPPV' },
      // Wrong-ear detection is the critical failure point the source doc calls out — an
      // unclear answer must not be treated the same as a confident one.
      { labelKey: 'data.help.q4ear.unclear', next: 'DX-BPPV-UNCLEAR' },
    ],
  },
  'DX-BPPV': outcome('DX-BPPV', 'info', 'data.help.outcome.bppv.title', [
    'data.help.outcome.bppv.note',
    'data.help.outcome.bppv.noteContraindications',
  ]),
  'DX-BPPV-UNCLEAR': outcome('DX-BPPV-UNCLEAR', 'info', 'data.help.outcome.bppvUnclear.title', [
    'data.help.outcome.bppvUnclear.note',
  ]),

  'Q3-EPI': {
    kind: 'question',
    id: 'Q3-EPI',
    textKey: 'data.help.q3epi.text',
    options: [
      { labelKey: 'data.help.q3epi.yesFluctuating', next: 'DX-MENIERE' },
      { labelKey: NO, next: 'Q5-MIG' },
    ],
  },
  'DX-MENIERE': outcome('DX-MENIERE', 'info', 'data.help.outcome.meniere.title', [
    'data.help.outcome.meniere.note',
  ]),

  'Q5-MIG': {
    kind: 'question',
    id: 'Q5-MIG',
    textKey: 'data.help.q5mig.text',
    options: [
      { labelKey: YES, next: 'DX-VM' },
      { labelKey: 'data.help.q5mig.noVascular', next: 'DX-TIA' },
      { labelKey: 'data.help.q5mig.noPlain', next: 'DX-PAROX' },
    ],
  },
  'DX-VM': outcome('DX-VM', 'info', 'data.help.outcome.vm.title', ['data.help.outcome.vm.note']),
  'DX-TIA': outcome('DX-TIA', 'urgent', 'data.help.outcome.tia.title', [
    'data.help.outcome.tia.note',
  ]),
  'DX-PAROX': outcome('DX-PAROX', 'info', 'data.help.outcome.paroxysmia.title', [
    'data.help.outcome.paroxysmia.note',
  ]),

  'Q3-CONT': yesNo('Q3-CONT', 'data.help.q3cont.text', 'DX-LAB', 'Q4-CENT'),
  'DX-LAB': outcome('DX-LAB', 'urgent', 'data.help.outcome.labyrinthitis.title', [
    'data.help.outcome.labyrinthitis.note',
  ]),
  'Q4-CENT': {
    kind: 'question',
    id: 'Q4-CENT',
    textKey: 'data.help.q4cent.text',
    options: [
      { labelKey: 'data.help.q4cent.abnormal', next: 'ER' },
      { labelKey: 'data.help.q4cent.normal', next: 'DX-NEURITIS' },
    ],
  },
  'DX-NEURITIS': outcome('DX-NEURITIS', 'info', 'data.help.outcome.neuritis.title', [
    'data.help.outcome.neuritis.note',
    'data.help.outcome.neuritis.noteFollowUp',
  ]),

  // --- Branch B: gradual onset ---------------------------------------------------------------
  Q2B: {
    kind: 'question',
    id: 'Q2B',
    textKey: 'data.help.q2b.text',
    options: [
      { labelKey: 'data.help.q2b.newMed', next: 'DX-OTO' },
      { labelKey: 'data.help.q2b.stress', next: 'DX-ANX' },
      // Shares Q3-CONT with branch A: the same infection/hearing check applies either way.
      { labelKey: 'data.help.q2b.neither', next: 'Q3-CONT' },
    ],
  },
  'DX-OTO': outcome('DX-OTO', 'info', 'data.help.outcome.ototoxicity.title', [
    'data.help.outcome.ototoxicity.note',
  ]),
  'DX-ANX': outcome('DX-ANX', 'info', 'data.help.outcome.anxiety.title', [
    'data.help.outcome.anxiety.note',
  ]),

  // --- Branch C: chronic -----------------------------------------------------------------------
  Q2C: {
    kind: 'question',
    id: 'Q2C',
    textKey: 'data.help.q2c.text',
    options: [
      { labelKey: 'data.help.q2c.rocking', next: 'DX-PPPD' },
      { labelKey: 'data.help.q2c.lightheaded', next: 'Q3-ORTHO' },
      { labelKey: 'data.help.q2c.neck', next: 'DX-CERV' },
      { labelKey: 'data.help.q2c.unsteady', next: 'DX-BIL' },
    ],
  },
  'DX-PPPD': outcome('DX-PPPD', 'info', 'data.help.outcome.pppd.title', [
    'data.help.outcome.pppd.note',
  ]),
  'Q3-ORTHO': yesNo('Q3-ORTHO', 'data.help.q3ortho.text', 'ER', 'DX-OH'),
  'DX-OH': outcome('DX-OH', 'info', 'data.help.outcome.oh.title', ['data.help.outcome.oh.note']),
  'DX-CERV': outcome('DX-CERV', 'info', 'data.help.outcome.cervicogenic.title', [
    'data.help.outcome.cervicogenic.note',
  ]),
  'DX-BIL': outcome('DX-BIL', 'info', 'data.help.outcome.bilateral.title', [
    'data.help.outcome.bilateral.note',
  ]),

  // --- Emergency ---------------------------------------------------------------------------
  ER: outcome('ER', 'emergency', 'data.help.urgentTitle', [
    'data.help.urgentStepCauses',
    'data.help.urgentStepCall',
    'data.help.urgentStepEscalate',
  ]),

  // Defensive only — reachable when a stored session's answers don't resolve cleanly (an old
  // shape, or a node id that no longer exists), never through normal play of the tree.
  'DX-UNKNOWN': outcome('DX-UNKNOWN', 'info', 'data.help.outcome.unknown.title', [
    'data.help.outcome.unknown.note',
  ]),
};

const FALLBACK_OUTCOME = HELP_NODES['DX-UNKNOWN'] as HelpOutcomeNode;

/** For rendering a stored answer: the question it was an answer to, if the set still has it. */
export function helpQuestionById(id: string): HelpQuestionNode | undefined {
  const node = HELP_NODES[id];
  return node?.kind === 'question' ? node : undefined;
}

/**
 * Replays a recorded (possibly partial) path from the start and returns wherever it lands —
 * another question if the path is incomplete, or the outcome it reached.
 */
export function currentNodeFor(answers: HelpAnswer[]): HelpNode {
  let node: HelpNode = HELP_NODES[HELP_START];
  for (const answer of answers) {
    if (node.kind !== 'question') break;
    const option = node.options[answer.optionIndex];
    if (!option) break;
    node = HELP_NODES[option.next] ?? FALLBACK_OUTCOME;
  }
  return node;
}

function resolveOutcome(answers: HelpAnswer[]): HelpOutcomeNode {
  const node = currentNodeFor(answers);
  return node.kind === 'outcome' ? node : FALLBACK_OUTCOME;
}

export type HelpGuidance = {
  severity: HelpOutcomeSeverity;
  titleKey: TKey;
  stepKeys: TKey[];
};

/** What to tell the user once a complete path has been answered. */
export function guidanceFor(answers: HelpAnswer[]): HelpGuidance {
  const outcomeNode = resolveOutcome(answers);
  return { severity: outcomeNode.severity, titleKey: outcomeNode.titleKey, stepKeys: outcomeNode.noteKeys };
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
  const outcomeNode = resolveOutcome(answers);
  if (outcomeNode.severity === 'emergency') return t(locale, 'data.help.summaryEmergency');
  return `${t(locale, 'data.help.summaryPrefix')} ${t(locale, outcomeNode.titleKey)}`;
}
