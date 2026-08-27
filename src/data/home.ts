import type { ImageSourcePropType } from 'react-native';

import type { TKey } from '../i18n';

/** Screen content, hardcoded to match Figma frames 7338:214828 and 7338:215283. */

/** An exercise as it exists in the app's library. */
export type ExerciseDefinition = {
  id: string;
  titleKey: TKey;
  /**
   * Minutes, not "3 min". The unit lives in `data.duration.minutes` so Hebrew can abbreviate it
   * its own way, and so search can eventually match on the number rather than on the label.
   */
  durationMinutes: number;
  thumbnail: ImageSourcePropType;
  /** Shown on the library card and searched against. */
  focusKey: TKey;
};

/** An exercise scheduled for today. `key` is per-instance so the same one can repeat. */
export type Exercise = ExerciseDefinition & {
  key: string;
  completed: boolean;
};

/**
 * Video stills exported from Figma (nodes 7338:214871 / 214881), centre-cropped square
 * and downscaled to 120px — 3x the 40px slot, so they stay sharp on retina.
 * Epley Left and Dix Hallpike share one still in the design (both are "Frame 75").
 */
const armStretchesThumb = require('../assets/arm-stretches.png') as ImageSourcePropType;
const bedExerciseThumb = require('../assets/epley-left.png') as ImageSourcePropType;

/**
 * Figma node 7338:215327 "ALL EXERCISES" — the full library.
 *
 * Extended past the three in the design so the library's search has something to filter. The
 * added names are real vestibular-rehab exercises, but only two video stills exist, so seated
 * exercises reuse one and lying-down exercises the other.
 * TODO(asset): a still per exercise.
 */
export const exerciseLibrary: ExerciseDefinition[] = [
  {
    id: 'arm-stretches',
    titleKey: 'data.exercise.armStretches.title',
    durationMinutes: 3,
    focusKey: 'data.exercise.armStretches.focus',
    thumbnail: armStretchesThumb,
  },
  {
    id: 'epley-left',
    titleKey: 'data.exercise.epleyLeft.title',
    durationMinutes: 5,
    focusKey: 'data.exercise.epleyLeft.focus',
    thumbnail: bedExerciseThumb,
  },
  {
    id: 'epley-right',
    titleKey: 'data.exercise.epleyRight.title',
    durationMinutes: 5,
    focusKey: 'data.exercise.epleyRight.focus',
    thumbnail: bedExerciseThumb,
  },
  {
    id: 'dix-hallpike',
    titleKey: 'data.exercise.dixHallpike.title',
    durationMinutes: 5,
    focusKey: 'data.exercise.dixHallpike.focus',
    thumbnail: bedExerciseThumb,
  },
  {
    id: 'brandt-daroff',
    titleKey: 'data.exercise.brandtDaroff.title',
    durationMinutes: 8,
    focusKey: 'data.exercise.brandtDaroff.focus',
    thumbnail: bedExerciseThumb,
  },
  {
    id: 'semont',
    titleKey: 'data.exercise.semont.title',
    durationMinutes: 6,
    focusKey: 'data.exercise.semont.focus',
    thumbnail: bedExerciseThumb,
  },
  {
    id: 'gaze-stabilisation',
    titleKey: 'data.exercise.gazeStabilisation.title',
    durationMinutes: 4,
    focusKey: 'data.exercise.gazeStabilisation.focus',
    thumbnail: armStretchesThumb,
  },
  {
    id: 'balance-training',
    titleKey: 'data.exercise.balanceTraining.title',
    durationMinutes: 6,
    focusKey: 'data.exercise.balanceTraining.focus',
    thumbnail: armStretchesThumb,
  },
  {
    id: 'neck-mobility',
    titleKey: 'data.exercise.neckMobility.title',
    durationMinutes: 3,
    focusKey: 'data.exercise.neckMobility.focus',
    thumbnail: armStretchesThumb,
  },
];

const byId = (id: string) => {
  const found = exerciseLibrary.find((exercise) => exercise.id === id);
  if (!found) throw new Error(`Unknown exercise: ${id}`);
  return found;
};

/**
 * Today's list, matching the edit screen (7338:215303). The Home card's own mock repeats
 * "Epley Left" for its third row, but that row sits below the 119px clip, so taking the
 * edit screen's list keeps both screens consistent with no visible difference.
 */
export const initialExercises: Exercise[] = [
  { ...byId('arm-stretches'), key: 'today-1', completed: true },
  { ...byId('epley-left'), key: 'today-2', completed: false },
  { ...byId('dix-hallpike'), key: 'today-3', completed: false },
];

/** A person's name is the same in every language, so it stays a literal rather than a key. */
export const user = {
  firstName: 'Dafna',
};

/**
 * Mock contact for the emergency sheet. The number is a reserved 555 test range so a
 * misfire during development can never reach a real person — swap for the user's saved
 * contact when the backend lands.
 *
 * Only the relationship is copy; the name and the number are the contact's own details.
 */
export const emergencyContact = {
  name: 'George',
  relationshipKey: 'data.emergency.relationship' as TKey,
  phone: '+1-555-0142',
};

/**
 * The five sleep chips.
 *
 * `hours` is what gets recorded, and it used to be recovered by comparing the rendered label
 * against `'Less than 6'` and `'9+'` — which would have turned every answer into `NaN` the
 * moment those labels were translated. The number now travels with the chip, and the label is
 * only ever displayed.
 */
export type SleepOption = {
  id: string;
  /** What `DayRecord.sleepHours` is set to. The two open-ended chips pick their nearest bound. */
  hours: number;
  labelKey: TKey;
};

export const sleepOptions: SleepOption[] = [
  { id: 'under-six', hours: 5, labelKey: 'data.sleep.optionUnderSix' },
  { id: 'six', hours: 6, labelKey: 'data.sleep.optionSix' },
  { id: 'seven', hours: 7, labelKey: 'data.sleep.optionSeven' },
  { id: 'eight', hours: 8, labelKey: 'data.sleep.optionEight' },
  { id: 'nine-plus', hours: 9, labelKey: 'data.sleep.optionNinePlus' },
];

/** Which chip a recorded answer came from, so a reopened task can show it selected. */
export function sleepOptionForHours(hours: number): SleepOption | undefined {
  if (hours <= 5) return sleepOptions[0];
  if (hours >= 9) return sleepOptions[sleepOptions.length - 1];
  return sleepOptions.find((option) => option.hours === hours);
}

export type TabKey = 'home' | 'liv' | 'menu';
