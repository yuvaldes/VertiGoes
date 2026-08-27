/**
 * Mock meditation and breathing drills.
 *
 * TODO(content): replace with real guided audio. TODO(asset): no audio or artwork exists yet,
 * so cards render an icon tile instead of a thumbnail.
 */

import type { TKey } from '../i18n';

export type MeditationDrill = {
  id: string;
  titleKey: TKey;
  /** Shown on the card and, eventually, searched against — same idea as exercise `focus`. */
  focusKey: TKey;
  /** Minutes, rendered through `data.duration.minutes` — as with exercises. */
  durationMinutes: number;
};

export const meditationDrills: MeditationDrill[] = [
  {
    id: 'box-breathing',
    titleKey: 'data.drill.boxBreathing.title',
    focusKey: 'data.drill.boxBreathing.focus',
    durationMinutes: 4,
  },
  {
    id: '4-7-8-breathing',
    titleKey: 'data.drill.breathing478.title',
    focusKey: 'data.drill.breathing478.focus',
    durationMinutes: 5,
  },
  {
    id: 'grounding-54321',
    titleKey: 'data.drill.grounding54321.title',
    focusKey: 'data.drill.grounding54321.focus',
    durationMinutes: 3,
  },
  {
    id: 'body-scan',
    titleKey: 'data.drill.bodyScan.title',
    focusKey: 'data.drill.bodyScan.focus',
    durationMinutes: 8,
  },
  {
    id: 'progressive-relaxation',
    titleKey: 'data.drill.progressiveRelaxation.title',
    focusKey: 'data.drill.progressiveRelaxation.focus',
    durationMinutes: 10,
  },
  {
    id: 'diaphragmatic-breathing',
    titleKey: 'data.drill.diaphragmaticBreathing.title',
    focusKey: 'data.drill.diaphragmaticBreathing.focus',
    durationMinutes: 6,
  },
  {
    id: 'sleep-wind-down',
    titleKey: 'data.drill.sleepWindDown.title',
    focusKey: 'data.drill.sleepWindDown.focus',
    durationMinutes: 12,
  },
];

export function meditationDrillById(id: string): MeditationDrill | undefined {
  return meditationDrills.find((drill) => drill.id === id);
}
