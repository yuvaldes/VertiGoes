import type { ChatMessage, LivAction } from '../data/livChat';

/**
 * What Liv knows about the user's day, pulled from the real DayRecord. Passing this in is
 * what lets even the mock provider say something specific — "you logged five hours last
 * night" is genuinely read out of state, not invented.
 */
export type DayContext = {
  sleepHours: number | null;
  episodes: number;
  exercisesDone: number;
  exercisesTotal: number;
};

export type LivReply = {
  text: string;
  /** Set when Liv wants to offer an action the user can accept. */
  action?: LivAction;
};

/**
 * The seam between the chat UI and whatever is actually generating replies.
 *
 * Everything above this interface — the screen, the bubbles, the per-day threads, the
 * calendar summary — is provider-agnostic. Swapping the scripted mock for a real model
 * means writing one new implementation and changing the single import in LivChatContext;
 * no UI or state code changes.
 */
export type LivProvider = {
  /** Liv's next reply, given the day's thread so far. */
  reply(history: ChatMessage[], day: DayContext): Promise<LivReply>;
  /** The one line the calendar shows for this day. */
  summarize(messages: ChatMessage[]): Promise<string>;
};
