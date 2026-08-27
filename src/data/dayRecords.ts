/**
 * Per-day history behind the calendar (Figma 7338:215666).
 *
 * The app had no history layer, so this both seeds plausible past days and receives live
 * writes from today's interactions. Mock days are generated from a deterministic PRNG
 * keyed on the date string, so a given day always yields the same values — the grid must
 * not churn between renders.
 */

import { t, weekdayNames, type Locale, type TKey } from '../i18n';
import { HELP_QUESTIONS, type HelpAnswer } from './helpFlow';

export type ExerciseSlot = 'morning' | 'midday' | 'evening';

export type SlotProgress = { done: number; total: number };

/**
 * The answer to Home's "how are you feeling" task.
 *
 * Lives here rather than beside the component because the streak needs to know a past day's
 * answer — the original Home kept this in local component state, so it was lost on navigation.
 */
export type Feeling = 'good' | 'bad';

/**
 * A completed in-app help session. Stores the answers themselves, not a rendered summary, so
 * the day-detail screen can show exactly what was asked and answered.
 */
export type InAppHelp = { answers: HelpAnswer[] };

export type DayRecord = {
  /** 'YYYY-MM-DD' — also the map key. */
  date: string;
  episodes: number;
  emergencyCall: boolean;
  inAppHelp: InAppHelp | null;
  sleepHours: number | null;
  feeling: Feeling | null;
  /** Some days schedule one exercise session, others three. */
  exercisePlan: 'once' | 'thrice';
  exercises: Partial<Record<ExerciseSlot, SlotProgress>>;
  liv: { summary: string } | null;
};

export const SLOT_ORDER: ExerciseSlot[] = ['morning', 'midday', 'evening'];

export const SLOT_LABEL_KEY: Record<ExerciseSlot, TKey> = {
  morning: 'data.slot.morning',
  midday: 'data.slot.midday',
  evening: 'data.slot.evening',
};

/** The one rule driving the orange dot under a day number. */
export function hasMarker(record: DayRecord | undefined): boolean {
  if (!record) return false;
  return record.episodes > 0 || record.emergencyCall || record.inAppHelp !== null;
}

export function emptyRecord(date: string): DayRecord {
  return {
    date,
    episodes: 0,
    emergencyCall: false,
    inAppHelp: null,
    sleepHours: null,
    feeling: null,
    // Live days come from the Home card's single flat list, so one session.
    exercisePlan: 'once',
    exercises: {},
    liv: null,
  };
}

// ---------------------------------------------------------------------------
// Date helpers. Everything stays in local time — constructing from components
// rather than parsing ISO strings, which would be read as UTC and can shift the day.
// ---------------------------------------------------------------------------

/**
 * The month, weekday and ordinal tables that used to live here have moved to `src/i18n`, which
 * derives them from `Intl` for the current language: `monthNames`, `weekdayNames`,
 * `formatLongDate`, `formatMonthDay`, or `useDateFormat()` inside a component. Its English
 * output is byte-identical to the tables it replaced, so nothing about English rendering moved
 * with them.
 */

export function toKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Sunday-first, matching the S M T W T F S header. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

/**
 * Monday-first, for Home's weekly episode chart — which labels Mon…Sun, unlike the
 * calendar grid above. Hebrew weeks also begin on Sunday, so this stays a chart design
 * choice rather than something the locale decides.
 */
export function startOfWeekMonday(date: Date): Date {
  const weekday = date.getDay();
  return addDays(date, -(weekday === 0 ? 6 : weekday - 1));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ---------------------------------------------------------------------------
// Derived reads for Home's status card and streak
// ---------------------------------------------------------------------------

/** Whether every exercise session the day scheduled was finished. */
function exercisesComplete(record: DayRecord): boolean {
  const planned = record.exercisePlan === 'once' ? (['morning'] as ExerciseSlot[]) : SLOT_ORDER;
  return planned.every((slot) => {
    const progress = record.exercises[slot];
    return progress !== undefined && progress.done >= progress.total;
  });
}

/** A day counts toward the streak once all three of Home's tasks are answered. */
export function isDayComplete(record: DayRecord | undefined): boolean {
  if (!record) return false;
  if (record.feeling === null || record.sleepHours === null) return false;
  return exercisesComplete(record);
}

/**
 * Consecutive complete days ending today.
 *
 * Today is judged by `todayComplete` rather than by its record, because today's exercises live
 * in `ExercisesContext` — dismissing the list clears it without writing slot progress, so the
 * record alone would disagree with what Home is showing.
 */
export function streakEndingToday(
  records: Map<string, DayRecord>,
  today: Date,
  todayComplete: boolean,
): number {
  let streak = todayComplete ? 1 : 0;
  for (let offset = 1; ; offset += 1) {
    if (!isDayComplete(records.get(toKey(addDays(today, -offset))))) break;
    streak += 1;
  }
  return streak;
}

/** One bar of the weekly chart. `episodes` is null for days that haven't happened yet. */
export type WeekBar = {
  key: string;
  label: string;
  episodes: number | null;
};

/** Monday-first week containing `today`; days after today read as empty rather than zero. */
export function episodeWeek(
  locale: Locale,
  records: Map<string, DayRecord>,
  today: Date,
): WeekBar[] {
  const monday = startOfWeekMonday(today);
  return weekdayNames(locale, 'short', 1).map((label, index) => {
    const date = addDays(monday, index);
    const key = toKey(date);
    const future = date.getTime() > today.getTime() && !isSameDay(date, today);
    return { key, label, episodes: future ? null : (records.get(key)?.episodes ?? 0) };
  });
}

function sumEpisodes(records: Map<string, DayRecord>, from: Date, days: number): number {
  let total = 0;
  for (let index = 0; index < days; index += 1) {
    total += records.get(toKey(addDays(from, index)))?.episodes ?? 0;
  }
  return total;
}

/**
 * The status card's headline, comparing this week so far against the same span last week —
 * elapsed days only, so a Tuesday isn't measured against a full seven days.
 *
 * Returns the key rather than the sentence: none of the four takes a parameter, so the caller's
 * own `t()` is the shortest path and the headline stays reactive to a language change.
 */
export function episodeTrendKey(records: Map<string, DayRecord>, today: Date): TKey {
  const monday = startOfWeekMonday(today);
  const elapsed = Math.round((today.getTime() - monday.getTime()) / 86400000) + 1;

  const thisWeek = sumEpisodes(records, monday, elapsed);
  const lastWeek = sumEpisodes(records, addDays(monday, -7), elapsed);

  if (thisWeek === 0 && lastWeek === 0) return 'data.trend.none';
  if (thisWeek < lastWeek) return 'data.trend.improving';
  if (thisWeek > lastWeek) return 'data.trend.worse';
  return 'data.trend.steady';
}

/**
 * Reads back a recorded sleep answer as a sentence, handling the open-ended chips.
 *
 * Takes a locale rather than returning a key, because one of the three branches needs the hour
 * count interpolated and handing the caller a key-plus-params pair to unpack costs more at every
 * call site than the leading argument does.
 */
export function describeSleep(locale: Locale, hours: number): string {
  if (hours <= 5) return t(locale, 'data.sleep.underSix');
  if (hours >= 9) return t(locale, 'data.sleep.ninePlus');
  return t(locale, 'data.sleep.hoursCount', { hours });
}

// ---------------------------------------------------------------------------
// Deterministic mock history
// ---------------------------------------------------------------------------

/** FNV-1a, so a date string maps to a stable 32-bit seed. */
function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, good enough for mock data. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LIV_SUMMARY_KEYS: TKey[] = [
  'data.livSummary.standing',
  'data.livSummary.spinning',
  'data.livSummary.sleep',
  'data.livSummary.epley',
  'data.livSummary.triggers',
];

/**
 * Seeds a past help session as answers to the real question set, so history and live sessions
 * are the same shape. Red-flag questions are always seeded `false` — a mock day should not
 * claim the user reported hearing loss.
 */
function seedHelpAnswers(random: () => number): HelpAnswer[] {
  return HELP_QUESTIONS.map((question) => ({
    questionId: question.id,
    answer: question.redFlag ? false : random() > 0.45,
  }));
}

/** How many days of history to fabricate behind today. */
const SEED_DAYS = 120;

/**
 * The three days before today are seeded fully complete, and the fourth deliberately is not,
 * so Home opens on a 3-day streak that becomes 4 once today's tasks are done — the exact
 * before/after the design shows. Demo-shaped mock data, not a rule about real users.
 */
const SEED_STREAK_DAYS = 3;

/**
 * Builds mock history for the `SEED_DAYS` days before `today` (today itself is left to
 * live interaction). Weekends get a lighter exercise plan; episodes are deliberately
 * sparse so the orange dots read as notable rather than constant.
 *
 * The Liv summaries are resolved to text here rather than stored as keys, because a real
 * summary is written once by the provider in whatever language the conversation happened in.
 * Seeded history behaves the same way: it is a record of something already said, so switching
 * language later leaves it alone.
 */
export function seedHistory(locale: Locale, today: Date): Map<string, DayRecord> {
  const records = new Map<string, DayRecord>();

  for (let offset = 1; offset <= SEED_DAYS; offset += 1) {
    const date = addDays(today, -offset);
    const key = toKey(date);
    const random = mulberry32(hashSeed(key));

    const episodeRoll = random();
    const episodes = episodeRoll > 0.82 ? (episodeRoll > 0.95 ? 2 : 1) : 0;
    const emergencyCall = episodes > 0 && random() > 0.88;
    const gotHelp = episodes > 0 && random() > 0.6;

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const exercisePlan: DayRecord['exercisePlan'] =
      isWeekend && random() > 0.4 ? 'once' : 'thrice';

    // See SEED_STREAK_DAYS: the run just behind today is fixed, so the streak is predictable.
    const inStreak = offset <= SEED_STREAK_DAYS;
    const breaksStreak = offset === SEED_STREAK_DAYS + 1;

    const slots: Partial<Record<ExerciseSlot, SlotProgress>> = {};
    const planned = exercisePlan === 'once' ? (['morning'] as ExerciseSlot[]) : SLOT_ORDER;
    planned.forEach((slot) => {
      const total = 3;
      const roll = random();
      const done = roll > 0.75 ? total : roll > 0.35 ? total - 1 : 0;
      slots[slot] = { done: inStreak ? total : done, total };
    });

    records.set(key, {
      date: key,
      episodes,
      emergencyCall,
      inAppHelp: gotHelp ? { answers: seedHelpAnswers(random) } : null,
      sleepHours: 5 + Math.floor(random() * 5),
      feeling: breaksStreak ? null : random() > 0.3 ? 'good' : 'bad',
      exercisePlan,
      exercises: slots,
      liv:
        random() > 0.45
          ? {
              summary: t(
                locale,
                LIV_SUMMARY_KEYS[Math.floor(random() * LIV_SUMMARY_KEYS.length)],
              ),
            }
          : null,
    });
  }

  return records;
}
