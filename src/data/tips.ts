/**
 * The Home carousel's extra cards: bite-sized vestibular science, one fact per card.
 *
 * Fixed content rather than anything derived from the log — these are "did you know" facts,
 * not observations about this user, so there is nothing to compute from `records`. Two show
 * at a time; which two is picked by the day, so the pair is stable within a day and steps
 * through the whole set before any pair repeats, rather than reshuffling or picking randomly.
 */

import type { TKey } from '../i18n';

/** Where a card's tap goes. Home can only reach the exercise list, so that is the only one. */
export type TipAction = 'exercises';

export type Tip = {
  id: string;
  /** Locale-agnostic, so it is a literal rather than a translation key — see `common.language`. */
  emoji: string;
  bodyKey: TKey;
  action?: TipAction;
};

/** How many cards the strip shows after the status card. */
const VISIBLE_TIPS = 2;

const FACTS: Tip[] = [
  {
    id: 'fact-rewire',
    emoji: '🧠',
    bodyKey: 'data.tip.rewire.body',
    action: 'exercises',
  },
  {
    id: 'fact-vor',
    emoji: '📸',
    bodyKey: 'data.tip.vor.body',
    action: 'exercises',
  },
  {
    id: 'fact-discomfort',
    emoji: '🎯',
    bodyKey: 'data.tip.discomfort.body',
    action: 'exercises',
  },
  {
    id: 'fact-balanceTrio',
    emoji: '🧗',
    bodyKey: 'data.tip.balanceTrio.body',
    action: 'exercises',
  },
  {
    id: 'fact-consistency',
    emoji: '⏱️',
    bodyKey: 'data.tip.consistency.body',
    action: 'exercises',
  },
];

/**
 * Today's pair. Day-of-year rotation, stepping by `VISIBLE_TIPS` so the strip works all the
 * way through `FACTS` before any pair repeats, rather than showing the same two forever or
 * reshuffling under the user between renders.
 */
export function selectTips(today: Date): Tip[] {
  const dayIndex = Math.floor(today.getTime() / 86400000);
  const start = (dayIndex * VISIBLE_TIPS) % FACTS.length;
  return Array.from({ length: VISIBLE_TIPS }, (_, step) => FACTS[(start + step) % FACTS.length]);
}
