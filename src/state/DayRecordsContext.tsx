import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  emptyRecord,
  seedHistory,
  toKey,
  type DayRecord,
  type ExerciseSlot,
  type Feeling,
  type InAppHelp,
  type SlotProgress,
} from '../data/dayRecords';
import { useLocale } from '../i18n';

type DayRecordsValue = {
  records: Map<string, DayRecord>;
  /** 'YYYY-MM-DD' for today, fixed at mount so it can't drift mid-session. */
  todayKey: string;
  today: Date;
  getRecord: (date: string) => DayRecord | undefined;
  recordEpisode: (date: string) => void;
  recordEmergencyCall: (date: string) => void;
  recordInAppHelp: (date: string, help: InAppHelp) => void;
  recordSleep: (date: string, hours: number) => void;
  recordFeeling: (date: string, feeling: Feeling) => void;
  recordExerciseSlot: (date: string, slot: ExerciseSlot, progress: SlotProgress) => void;
  /** Written by the Liv chat as the day's conversation grows; read by the calendar. */
  recordLivSummary: (date: string, summary: string) => void;
  /** Drops today's writes and re-seeds history, so a new account starts from a clean slate. */
  reset: () => void;
};

const DayRecordsContext = createContext<DayRecordsValue | null>(null);

/**
 * Holds the calendar's history. Seeded once with mock past days, then updated in place by
 * today's interactions on the Home screen — so the calendar and Home never disagree.
 */
export function DayRecordsProvider({ children }: { children: ReactNode }) {
  // Captured once: a re-render must not move "today" and re-seed a different range.
  const today = useRef(new Date()).current;
  const todayKey = useMemo(() => toKey(today), [today]);
  const locale = useLocale();

  const [records, setRecords] = useState<Map<string, DayRecord>>(() =>
    seedHistory(locale, today),
  );

  /**
   * The ref is the source of truth; state mirrors it so React re-renders.
   *
   * This exists because callers write a record and then immediately read it back in the same
   * tick — the help flow records a session and asks for a fresh day summary right after. Reading
   * through `records` there returns the pre-update value, so the summary silently missed the
   * write. Keeping a synchronous mirror makes write-then-read correct.
   */
  const recordsRef = useRef(records);

  /** Copy-on-write so consumers re-render, applying `mutate` to the day's record. */
  const update = useCallback((date: string, mutate: (record: DayRecord) => DayRecord) => {
    const base = recordsRef.current;
    const next = new Map(base);
    next.set(date, mutate(base.get(date) ?? emptyRecord(date)));
    // Ref first, so a read later in this tick sees the write; `mutate` runs exactly once.
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const getRecord = useCallback((date: string) => recordsRef.current.get(date), []);

  const recordEpisode = useCallback(
    (date: string) => update(date, (r) => ({ ...r, episodes: r.episodes + 1 })),
    [update],
  );

  const recordEmergencyCall = useCallback(
    (date: string) => update(date, (r) => ({ ...r, emergencyCall: true })),
    [update],
  );

  const recordInAppHelp = useCallback(
    (date: string, help: InAppHelp) => update(date, (r) => ({ ...r, inAppHelp: help })),
    [update],
  );

  const recordSleep = useCallback(
    (date: string, hours: number) => update(date, (r) => ({ ...r, sleepHours: hours })),
    [update],
  );

  const recordFeeling = useCallback(
    (date: string, feeling: Feeling) => update(date, (r) => ({ ...r, feeling })),
    [update],
  );

  const recordExerciseSlot = useCallback(
    (date: string, slot: ExerciseSlot, progress: SlotProgress) =>
      update(date, (r) => ({ ...r, exercises: { ...r.exercises, [slot]: progress } })),
    [update],
  );

  const recordLivSummary = useCallback(
    (date: string, summary: string) =>
      // An empty summary clears the section rather than leaving a blank bubble.
      update(date, (r) => ({ ...r, liv: summary ? { summary } : null })),
    [update],
  );

  const reset = useCallback(() => {
    const fresh = seedHistory(locale, today);
    recordsRef.current = fresh;
    setRecords(fresh);
  }, [locale, today]);

  const value = useMemo(
    () => ({
      records,
      todayKey,
      today,
      getRecord,
      recordEpisode,
      recordEmergencyCall,
      recordInAppHelp,
      recordSleep,
      recordFeeling,
      recordExerciseSlot,
      recordLivSummary,
      reset,
    }),
    [
      records,
      todayKey,
      today,
      getRecord,
      recordEpisode,
      recordEmergencyCall,
      recordInAppHelp,
      recordSleep,
      recordFeeling,
      recordExerciseSlot,
      recordLivSummary,
      reset,
    ],
  );

  return <DayRecordsContext.Provider value={value}>{children}</DayRecordsContext.Provider>;
}

export function useDayRecords() {
  const value = useContext(DayRecordsContext);
  if (!value) throw new Error('useDayRecords must be used inside a DayRecordsProvider');
  return value;
}
