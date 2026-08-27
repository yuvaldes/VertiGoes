import type { ChatMessage } from '../data/livChat';
import type { DayContext, LivProvider, LivReply } from './livProvider';

/**
 * A scripted stand-in for a real model.
 *
 * It matches intents on keywords and then grounds the reply in the actual DayRecord, which
 * is what keeps it from reading as canned — the sleep and exercise replies quote real
 * numbers out of state. Everything is deliberately behind the LivProvider interface so this
 * whole file can be deleted when a real model is wired up.
 *
 * TODO(ai): replace with a real provider. The call sites only depend on `reply` and
 * `summarize`, so this is a drop-in swap in LivChatContext.
 */

type Intent = 'greeting' | 'episode' | 'sleep' | 'exercise' | 'distress' | 'thanks' | 'other';

const PATTERNS: [Intent, RegExp][] = [
  ['distress', /\b(help|scared|frightened|panic|panicking|can'?t cope|getting worse|emergency)\b/i],
  [
    'episode',
    /\b(dizzy|dizziness|spinning|spun|vertigo|episode|attack|lighthead|light-head|off balance|unsteady|nauseous|nausea)\b/i,
  ],
  ['sleep', /\b(sleep|slept|sleeping|tired|exhausted|insomnia|awake|rest|nap)\b/i],
  ['exercise', /\b(exercise|exercises|epley|dix|hallpike|stretch|stretches|manoeuvre|maneuver)\b/i],
  ['thanks', /\b(thanks|thank you|cheers|appreciate)\b/i],
  ['greeting', /^\s*(hi|hey|hello|good (morning|afternoon|evening))\b/i],
];

function detect(text: string): Intent {
  for (const [intent, pattern] of PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return 'other';
}

/** Rotates through variants so a repeated intent doesn't get an identical reply. */
let variantCursor = 0;
function pick<T>(options: T[]): T {
  const chosen = options[variantCursor % options.length];
  variantCursor += 1;
  return chosen;
}

/** Simulated thinking time, so the typing indicator has a reason to exist. */
const MIN_LATENCY_MS = 500;
const MAX_LATENCY_MS = 1100;

const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS));
  });

function episodeReply(day: DayContext): LivReply {
  const opener = pick([
    'That sounds unpleasant — I’m sorry you’re dealing with it.',
    'Thank you for telling me. That must have been unsettling.',
    'I’m glad you mentioned it.',
  ]);

  const context =
    day.sleepHours !== null && day.sleepHours < 6
      ? ` You logged ${day.sleepHours} hours of sleep, and short nights do tend to show up as more episodes.`
      : day.episodes > 0
        ? ` That would make ${day.episodes + 1} today.`
        : '';

  return { text: `${opener}${context}` };
}

function sleepReply(day: DayContext): LivReply {
  if (day.sleepHours === null) {
    return {
      text: pick([
        'You haven’t logged your sleep yet today. How many hours did you get?',
        'I don’t have last night down yet — roughly how long did you sleep?',
      ]),
    };
  }
  if (day.sleepHours < 6) {
    return {
      text: `You logged ${day.sleepHours} hours, which is on the short side. Sleep and balance are closely linked, so a shorter night can make the dizziness feel worse the next day. Is something making it hard to sleep?`,
    };
  }
  return {
    text: `${day.sleepHours} hours is a decent night. Keeping it steady is one of the more reliable things you can do for the episodes.`,
  };
}

function exerciseReply(day: DayContext): LivReply {
  if (day.exercisesTotal === 0) {
    return { text: 'You don’t have any exercises scheduled today. Want to look at your plan?' };
  }
  if (day.exercisesDone >= day.exercisesTotal) {
    return {
      text: `You’ve done all ${day.exercisesTotal} today — nicely consistent. The Epley manoeuvre works best when it’s repeated over days rather than done perfectly once.`,
    };
  }
  return {
    text: `You’re at ${day.exercisesDone} of ${day.exercisesTotal} today. Take them slowly, and stop if the spinning gets sharp. Shall I mark one done?`,
    action: { kind: 'completeExercise', slot: 'morning' },
  };
}

export const mockLivProvider: LivProvider = {
  async reply(history, day) {
    await delay();

    const lastUser = [...history].reverse().find((message) => message.role === 'user');
    if (!lastUser) {
      return { text: 'I’m here whenever you want to talk.' };
    }

    switch (detect(lastUser.text)) {
      case 'distress':
        return {
          text: pick([
            'I’m here. Let’s take this one step at a time — first, sit or lie down somewhere you feel supported.',
            'Okay. You’re not on your own with this. Let’s slow it down together.',
          ]) + ' I can walk you through it now if you’d like.',
          action: { kind: 'startHelp' },
        };

      case 'episode':
        return episodeReply(day);

      case 'sleep':
        return sleepReply(day);

      case 'exercise':
        return exerciseReply(day);

      case 'thanks':
        return {
          text: pick([
            'Any time. I’ll be here tomorrow too.',
            'Of course. Come back whenever something changes.',
          ]),
        };

      case 'greeting':
        return {
          text: pick([
            'Hello. How are you feeling right now?',
            'Hi. How’s your balance been today?',
          ]),
        };

      default:
        return {
          text: pick([
            'Tell me a bit more — when did you first notice it?',
            'I see. Does it come on when you move your head, or is it there all the time?',
            'Got it. How long did that last?',
          ]),
        };
    }
  },

  async summarize(messages) {
    const userMessages = messages.filter((message) => message.role === 'user');
    if (userMessages.length === 0) return '';

    // Collect the topics actually raised, so a long conversation reads as a summary rather
    // than as a quote of one line.
    const topics = new Set<Intent>();
    userMessages.forEach((message) => {
      const intent = detect(message.text);
      if (intent !== 'greeting' && intent !== 'thanks' && intent !== 'other') topics.add(intent);
    });

    const phrases: string[] = [];
    if (topics.has('episode')) phrases.push('an episode of spinning');
    if (topics.has('distress')) phrases.push('needing help in the moment');
    if (topics.has('sleep')) phrases.push('your sleep');
    if (topics.has('exercise')) phrases.push('your exercises');

    if (phrases.length === 0) {
      // Nothing recognisable — quote the longest thing the user said instead of guessing.
      const longest = userMessages.reduce((a, b) => (b.text.length > a.text.length ? b : a));
      const trimmed = longest.text.trim();
      return trimmed.length > 90 ? `${trimmed.slice(0, 87).trimEnd()}…` : trimmed;
    }

    const list =
      phrases.length === 1
        ? phrases[0]
        : `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
    return `You talked about ${list}.`;
  },
};
