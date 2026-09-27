import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  emptyRecord,
  toKey,
  type DayRecord,
  type ExerciseSlot,
  type Feeling,
  type InAppHelp,
  type SlotProgress,
} from '../data/dayRecords';
import {
  createDayRecordsStore,
  createDayRecordsTransport,
  type DayRecordsSyncStatus,
} from '../lib/dayRecords';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type { DayRecordsSyncStatus } from '../lib/dayRecords';

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
  syncStatus: DayRecordsSyncStatus;
  /** Retries a failed initial load or pending saves; errors are reported through syncStatus. */
  retrySync: () => void;
  /** Clears local history/pending writes. Never deletes cloud records or uploads guest seeds. */
  reset: () => void;
};

const DayRecordsContext = createContext<DayRecordsValue | null>(null);

/**
 * Account-scoped cloud history, or a separate empty guest store. Switching identity replaces the
 * store during render, so neither records nor captured callbacks can cross accounts.
 */
export function DayRecordsProvider({ children }: { children: ReactNode }) {
  // Captured once: a re-render must not move "today".
  const today = useRef(new Date()).current;
  const todayKey = useMemo(() => toKey(today), [today]);
  const { account, isAuthed, isRestoring } = useAuth();
  const userId = !isRestoring && isAuthed ? account?.id ?? null : null;
  const store = useMemo(() => createDayRecordsStore({
    // Do not show fictional episodes, calls, or chat history to visitors.
    initialRecords: new Map(),
    emptyRecord,
    transport: userId ? createDayRecordsTransport(supabase, userId) : null,
    readOnly: isRestoring,
  }), [userId, isRestoring]);
  const { records, syncStatus } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useLayoutEffect(() => {
    store.start();
    let invalidatedByAuth = false;
    // Invalidate immediately on SDK sign-out/account replacement, before auth's next render.
    const subscription = userId ? supabase?.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== userId) {
        invalidatedByAuth = true;
        store.stop();
        store.reset(new Map());
      } else if (invalidatedByAuth) {
        // Also handle sign-out/re-entry to the same account batched into one React render.
        invalidatedByAuth = false;
        store.start();
      }
    }).data.subscription : undefined;
    return () => {
      subscription?.unsubscribe();
      store.stop();
    };
  }, [store, userId]);

  // Synchronous snapshot reads retain the existing write-then-read contract for the help flow.
  const update = store.update;
  const getRecord = store.getRecord;

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
    store.reset(new Map());
  }, [store]);
  const retrySync = store.retrySync;

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
      syncStatus,
      retrySync,
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
      syncStatus,
      retrySync,
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
