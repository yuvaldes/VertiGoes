import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { mockLivProvider } from '../ai/mockLivProvider';
import type { DayContext } from '../ai/livProvider';
import { SLOT_ORDER, type DayRecord } from '../data/dayRecords';
import { describeHelpSession } from '../data/helpFlow';
import { makeMessage, type ChatMessage, type ChatThread, type LivAction } from '../data/livChat';
import { useLocale } from '../i18n';
import { useDayRecords } from './DayRecordsContext';

/** Swap this one binding to move off the scripted mock. */
const provider = mockLivProvider;

type LivChatValue = {
  threads: Map<string, ChatThread>;
  /** Today's messages — the only thread the composer writes to. */
  todayMessages: ChatMessage[];
  isThinking: boolean;
  send: (text: string) => void;
  acceptAction: (messageId: string) => void;
  getThread: (date: string) => ChatThread | undefined;
  /** Recomposes a day's calendar summary. Called by the help flow, which is not a chat. */
  refreshDaySummary: (date: string) => void;
  /** Drops every thread, so a new account doesn't inherit the last one's conversation. */
  reset: () => void;
};

const LivChatContext = createContext<LivChatValue | null>(null);

/** Flattens a DayRecord into the grounding the provider needs. */
function toDayContext(record: DayRecord | undefined): DayContext {
  if (!record) {
    return { sleepHours: null, episodes: 0, exercisesDone: 0, exercisesTotal: 0 };
  }
  let done = 0;
  let total = 0;
  SLOT_ORDER.forEach((slot) => {
    const progress = record.exercises[slot];
    if (progress) {
      done += progress.done;
      total += progress.total;
    }
  });
  return {
    sleepHours: record.sleepHours,
    episodes: record.episodes,
    exercisesDone: done,
    exercisesTotal: total,
  };
}

/**
 * The Liv conversation, stored one thread per calendar day.
 *
 * Must be nested inside DayRecordsProvider: it reads the day's record to ground replies, and
 * writes the day's summary back so the calendar can show it.
 */
export function LivChatProvider({ children }: { children: ReactNode }) {
  const { todayKey, getRecord, recordExerciseSlot, recordLivSummary } = useDayRecords();
  const locale = useLocale();

  const [threads, setThreads] = useState<Map<string, ChatThread>>(() => new Map());
  const [isThinking, setIsThinking] = useState(false);

  // Mirrors `threads` so async callbacks read the latest without being re-created.
  const threadsRef = useRef(threads);
  threadsRef.current = threads;

  const messagesFor = useCallback(
    (date: string) => threadsRef.current.get(date)?.messages ?? [],
    [],
  );

  const commit = useCallback((date: string, messages: ChatMessage[]) => {
    setThreads((current) => {
      const next = new Map(current);
      next.set(date, { date, messages });
      return next;
    });
    // Keep the ref in step immediately — `send` appends twice in one turn (the user's
    // message, then Liv's) and the second append must see the first.
    threadsRef.current = new Map(threadsRef.current).set(date, { date, messages });
  }, []);

  /**
   * Recomputes the day's calendar summary.
   *
   * The provider only summarises the conversation, but the calendar line describes the whole
   * day — so the help session is composed in here rather than inside the provider, which has no
   * access to the day record. Keeping one writer of `DayRecord.liv` avoids two sources fighting
   * over it. Exposed so the help flow can refresh the summary on a day with no chat at all.
   */
  const refreshDaySummary = useCallback(
    async (date: string) => {
      const chatSummary = await provider.summarize(messagesFor(date));
      const help = getRecord(date)?.inAppHelp;
      const sentences = [chatSummary, help ? describeHelpSession(locale, help.answers) : ''].filter(
        Boolean,
      );
      recordLivSummary(date, sentences.join(' '));
    },
    [getRecord, locale, messagesFor, recordLivSummary],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const date = todayKey;
      const withUser = [...messagesFor(date), makeMessage('user', trimmed)];
      commit(date, withUser);
      setIsThinking(true);

      provider
        .reply(withUser, toDayContext(getRecord(date)))
        .then((reply) => {
          commit(date, [
            ...messagesFor(date),
            makeMessage('liv', reply.text, { action: reply.action }),
          ]);
        })
        .catch(() => {
          commit(date, [
            ...messagesFor(date),
            makeMessage('liv', 'Sorry — I lost that. Could you say it again?'),
          ]);
        })
        .finally(() => {
          setIsThinking(false);
          void refreshDaySummary(date);
        });
    },
    [commit, getRecord, isThinking, messagesFor, refreshDaySummary, todayKey],
  );

  /** Runs the action attached to a Liv message, then has her acknowledge it. */
  const acceptAction = useCallback(
    (messageId: string) => {
      const date = todayKey;
      const messages = messagesFor(date);
      const target = messages.find((message) => message.id === messageId);
      if (!target?.action || target.actionTaken) return;

      const acknowledgement = runAction(target.action, date, {
        recordExerciseSlot,
        getRecord,
      });

      const marked = messages.map((message) =>
        message.id === messageId ? { ...message, actionTaken: true } : message,
      );
      commit(date, [...marked, makeMessage('liv', acknowledgement)]);
      void refreshDaySummary(date);
    },
    [commit, getRecord, messagesFor, recordExerciseSlot, refreshDaySummary, todayKey],
  );

  const getThread = useCallback((date: string) => threads.get(date), [threads]);

  const reset = useCallback(() => {
    threadsRef.current = new Map();
    setThreads(new Map());
    setIsThinking(false);
  }, []);

  const value = useMemo(
    () => ({
      threads,
      todayMessages: threads.get(todayKey)?.messages ?? [],
      isThinking,
      send,
      acceptAction,
      getThread,
      refreshDaySummary,
      reset,
    }),
    [threads, todayKey, isThinking, send, acceptAction, getThread, refreshDaySummary, reset],
  );

  return <LivChatContext.Provider value={value}>{children}</LivChatContext.Provider>;
}

type Mutators = {
  recordExerciseSlot: (
    date: string,
    slot: 'morning' | 'midday' | 'evening',
    progress: { done: number; total: number },
  ) => void;
  getRecord: (date: string) => DayRecord | undefined;
};

/**
 * Every action routes through the same mutators the rest of the app uses, so anything
 * logged here lands on the calendar by the path that already works.
 */
function runAction(action: LivAction, date: string, m: Mutators): string {
  switch (action.kind) {
    case 'startHelp':
      // Records nothing: the help flow itself writes the session once the questions are
      // answered. Accepting here only opens it, so an abandoned flow leaves no false record.
      return 'Okay — I’ll walk you through it. A few quick questions first.';

    case 'completeExercise': {
      const existing = m.getRecord(date)?.exercises[action.slot];
      const total = existing?.total ?? 3;
      const done = Math.min(total, (existing?.done ?? 0) + 1);
      m.recordExerciseSlot(date, action.slot, { done, total });
      return `Marked — you’re at ${done} of ${total} for the ${action.slot} set.`;
    }
  }
}

export function useLivChat() {
  const value = useContext(LivChatContext);
  if (!value) throw new Error('useLivChat must be used inside a LivChatProvider');
  return value;
}
