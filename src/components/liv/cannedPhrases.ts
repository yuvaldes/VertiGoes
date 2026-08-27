import { t, type Locale, type TKey } from '../../i18n';

/**
 * SIMULATED speech input, shared by every voice affordance in the composer — dictation and
 * hands-free voice mode alike. See `VoiceListening.tsx` for why this is a cursor through a
 * canned list rather than real speech-to-text.
 */
/** How long a simulated listen runs before it "hears" something — dictation and voice mode alike. */
export const LISTEN_DELAY_MS = 1800;

/**
 * Keys, not strings: the phrase is dropped into the user's own turn in the thread, so it has
 * to arrive in the language they are reading.
 */
export const CANNED_PHRASE_KEYS: TKey[] = [
  'ui.cannedPhrase.episodeMorning',
  'ui.cannedPhrase.sleepFiveHours',
  'ui.cannedPhrase.exercisesDizzy',
  'ui.cannedPhrase.unsteady',
];

let cursor = 0;

/**
 * Advances the shared cursor, so dictation and voice mode never repeat the same line back to
 * back.
 *
 * `locale` is optional only so a caller outside a component can still reach this; pass the
 * value from `useLocale()` wherever there is one, or the simulated speech comes back English
 * in a Hebrew thread.
 */
export function nextCannedPhrase(locale: Locale = 'en'): string {
  const key = CANNED_PHRASE_KEYS[cursor % CANNED_PHRASE_KEYS.length];
  cursor += 1;
  return t(locale, key);
}
