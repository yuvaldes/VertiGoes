import { intlLocale, type Locale, type TKey } from '../i18n';
import type { ExerciseSlot } from './dayRecords';

/** Who said it. 'liv' is the assistant. */
export type ChatRole = 'user' | 'liv';

/**
 * Something Liv can offer to do on the user's behalf. Accepting one writes into
 * DayRecordsContext through the mutators the rest of the app already uses, which is what
 * makes the chat load-bearing rather than decorative.
 */
export type LivAction =
  | { kind: 'startHelp' }
  | { kind: 'completeExercise'; slot: ExerciseSlot };

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Epoch ms, for the time stamp and for ordering. */
  at: number;
  /** Set when Liv is proposing something the user can accept. */
  action?: LivAction;
  actionTaken?: boolean;
};

/**
 * One thread per calendar day. Keying by day is what makes the calendar summary fall out
 * naturally — there is no separate notion of a "conversation" to reconcile.
 */
export type ChatThread = {
  /** 'YYYY-MM-DD', matching DayRecord.date. */
  date: string;
  messages: ChatMessage[];
};

/** Monotonic within a session; ids only need to be unique for React keys. */
let idCounter = 0;

export function makeMessage(
  role: ChatRole,
  text: string,
  extras: Partial<Pick<ChatMessage, 'action'>> = {},
): ChatMessage {
  idCounter += 1;
  return { id: `m${idCounter}`, role, text, at: Date.now(), ...extras };
}

/** Labels for the action buttons, so the UI and the provider can't drift apart. */
export const ACTION_LABEL_KEY: Record<LivAction['kind'], TKey> = {
  startHelp: 'data.livAction.startHelp',
  completeExercise: 'data.livAction.completeExercise',
};

/**
 * A message time stamp. The clock itself is a locale property — English here is 24-hour because
 * the app's English is en-GB, and Hebrew is too — so this asks `Intl` rather than hand-rolling
 * an AM/PM split, as it used to.
 */
export function formatTime(locale: Locale, at: number): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(at);
  } catch {
    const date = new Date(at);
    return `${date.getHours()}:${`${date.getMinutes()}`.padStart(2, '0')}`;
  }
}
