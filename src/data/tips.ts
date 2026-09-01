/**
 * The Home carousel's cards: what the log says about you, and what to do about it.
 *
 * Three kinds, and the distinction is the point rather than decoration. An `insight` states
 * something the record actually shows. A `progress` card credits a habit that is holding. A
 * `coach` card asks for one specific thing. A carousel of nothing but advice reads as nagging;
 * a carousel of nothing but statistics reads as a dashboard.
 *
 * Selection is deterministic — the same day and the same log always produce the same cards, so
 * the strip does not reshuffle under the user between renders. Keys, not sentences, per the
 * data-module convention: the screen resolves them.
 */

import type { TKey } from '../i18n';
import {
  addDays,
  isDayComplete,
  hasMarker,
  toKey,
  type DayRecord,
} from './dayRecords';

export type TipTone = 'insight' | 'progress' | 'coach';

/** Where a card's tap goes. Home can only reach the exercise list, so that is the only one. */
export type TipAction = 'exercises';

export type Tip = {
  id: string;
  tone: TipTone;
  titleKey: TKey;
  bodyKey: TKey;
  /** Resolved into both title and body; a card without markers ignores them. */
  params?: Readonly<Record<string, string | number>>;
  action?: TipAction;
};

/** How many cards the strip shows. Past this it stops being a glance and becomes a backlog. */
const MAX_TIPS = 5;

/** Below this, a night counts as short - the figure the app's own sleep insight already uses. */
const SHORT_SLEEP_HOURS = 7;

/** The window every "lately" claim is measured over, today included. */
const RECENT_DAYS = 7;

function recentDays(records: Map<string, DayRecord>, today: Date, days: number): DayRecord[] {
  const out: DayRecord[] = [];
  for (let back = 0; back < days; back += 1) {
    const record = records.get(toKey(addDays(today, -back)));
    if (record) out.push(record);
  }
  return out;
}

/** Consecutive days ending today (or yesterday, if today is not logged yet) with any entry. */
function loggingStreak(records: Map<string, DayRecord>, today: Date): number {
  let streak = 0;
  // Starting at -1 when today is blank means an unlogged morning does not read as a broken
  // streak - the day is not over yet.
  const start = hasMarker(records.get(toKey(today))) ? 0 : 1;
  for (let back = start; back < 60; back += 1) {
    if (!hasMarker(records.get(toKey(addDays(today, -back))))) break;
    streak += 1;
  }
  return streak;
}

function sumEpisodes(days: DayRecord[]): number {
  return days.reduce((total, day) => total + day.episodes, 0);
}

/**
 * Evergreen coaching, used to fill the strip out when the log is too thin to say anything
 * specific - which is exactly when a new user needs the advice most.
 *
 * Rotated by the date rather than shuffled so the strip is stable within a day but does not
 * show the same three cards forever.
 */
const EVERGREEN: Tip[] = [
  {
    id: 'evergreen-log-early',
    tone: 'coach',
    titleKey: 'data.tip.logEarly.title',
    bodyKey: 'data.tip.logEarly.body',
  },
  {
    id: 'evergreen-same-time',
    tone: 'coach',
    titleKey: 'data.tip.sameTime.title',
    bodyKey: 'data.tip.sameTime.body',
    action: 'exercises',
  },
  {
    id: 'evergreen-move-slowly',
    tone: 'coach',
    titleKey: 'data.tip.moveSlowly.title',
    bodyKey: 'data.tip.moveSlowly.body',
  },
  {
    id: 'evergreen-breathe',
    tone: 'coach',
    titleKey: 'data.tip.breathe.title',
    bodyKey: 'data.tip.breathe.body',
  },
  {
    id: 'evergreen-triggers',
    tone: 'coach',
    titleKey: 'data.tip.triggers.title',
    bodyKey: 'data.tip.triggers.body',
  },
];

/**
 * Which cards to show today.
 *
 * Ordered by how much the card is earned by the data: an observation about this week beats a
 * habit note, which beats generic advice. Everything specific is emitted first, then evergreen
 * cards top the strip up to `MAX_TIPS`.
 */
export function selectTips(records: Map<string, DayRecord>, today: Date): Tip[] {
  const tips: Tip[] = [];

  const week = recentDays(records, today, RECENT_DAYS);
  const previous: DayRecord[] = [];
  for (let back = RECENT_DAYS; back < RECENT_DAYS * 2; back += 1) {
    const record = records.get(toKey(addDays(today, -back)));
    if (record) previous.push(record);
  }

  const episodes = sumEpisodes(week);
  const episodesBefore = sumEpisodes(previous);
  const shortNights = week.filter(
    (day) => day.sleepHours !== null && day.sleepHours < SHORT_SLEEP_HOURS,
  ).length;
  const completeDays = week.filter(isDayComplete).length;
  const streak = loggingStreak(records, today);

  // The strongest signal the app has: two comparable windows of the same length.
  if (previous.length >= RECENT_DAYS - 1 && episodes < episodesBefore) {
    tips.push({
      id: 'episodes-down',
      tone: 'insight',
      titleKey: 'data.tip.episodesDown.title',
      bodyKey: 'data.tip.episodesDown.body',
      params: { count: episodesBefore - episodes },
    });
  } else if (previous.length >= RECENT_DAYS - 1 && episodes > episodesBefore) {
    tips.push({
      id: 'episodes-up',
      tone: 'coach',
      titleKey: 'data.tip.episodesUp.title',
      bodyKey: 'data.tip.episodesUp.body',
      action: 'exercises',
      params: { count: episodes - episodesBefore },
    });
  }

  // Stated as a correlation the user can check, never as a cause - the app has no evidence
  // that the sleep produced the episodes, only that both happened in the same week.
  if (shortNights >= 3) {
    tips.push({
      id: 'short-sleep',
      tone: 'insight',
      titleKey: 'data.tip.shortSleep.title',
      bodyKey: 'data.tip.shortSleep.body',
      params: { nights: shortNights, hours: SHORT_SLEEP_HOURS },
    });
  }

  if (streak >= 3) {
    tips.push({
      id: 'logging-streak',
      tone: 'progress',
      titleKey: 'data.tip.loggingStreak.title',
      bodyKey: 'data.tip.loggingStreak.body',
      params: { days: streak },
    });
  }

  // Only worth saying once there is a week to judge; on day two it is just noise.
  if (week.length >= 4 && completeDays <= week.length - 3) {
    tips.push({
      id: 'finish-the-day',
      tone: 'coach',
      titleKey: 'data.tip.finishTheDay.title',
      bodyKey: 'data.tip.finishTheDay.body',
      action: 'exercises',
      params: { done: completeDays, total: week.length },
    });
  }

  // Day-of-year rotation: stable all day, different tomorrow.
  const dayIndex = Math.floor(today.getTime() / 86400000);
  for (let step = 0; step < EVERGREEN.length && tips.length < MAX_TIPS; step += 1) {
    tips.push(EVERGREEN[(dayIndex + step) % EVERGREEN.length]);
  }

  return tips.slice(0, MAX_TIPS);
}
