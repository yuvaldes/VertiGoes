import type { PartialTranslations } from '../index';

import { auth } from './auth';
import { browse } from './browse';
import { common } from './common';
import { data } from './data';
import { feedback } from './feedback';
import { flows } from './flows';
import { home } from './home';
import { legal } from './legal';
import { ui } from './ui';

/**
 * The Hebrew tree. Partial on purpose: a key that has not been translated yet resolves to
 * English at runtime rather than rendering the raw key, and warns once in dev. That keeps a
 * half-finished namespace shippable instead of blocking the whole app on one missing string.
 *
 * `PartialTranslations` is imported as a type only, so the cycle back to `../index` is erased
 * before the bundler ever sees it.
 */
export const he = {
  auth,
  browse,
  common,
  data,
  feedback,
  flows,
  home,
  legal,
  ui,
} satisfies PartialTranslations;
