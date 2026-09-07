import { auth } from './auth';
import { browse } from './browse';
import { common } from './common';
import { data } from './data';
import { flows } from './flows';
import { home } from './home';
import { ui } from './ui';

/**
 * The English tree, and with it the app's key contract: `t()` is typed against this object,
 * so a key that is not reachable here is a compile error rather than a blank label.
 *
 * Adding a namespace is two lines: create `en/<ns>.ts` exporting `<ns>` `as const`, then
 * import it and add it to this object. Do the mirror-image edit in `he/index.ts`.
 */
export const en = {
  auth,
  browse,
  common,
  data,
  flows,
  home,
  ui,
} as const;
