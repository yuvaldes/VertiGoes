import { useMemo } from 'react';

import type { TKey } from '../i18n';
import { useAuth, type AuthSession } from '../state/AuthContext';
import { useSubscription } from '../state/SubscriptionContext';

/**
 * Everything a visitor can try to do that is not simply looking at Home.
 *
 * Home itself has no capability on purpose. A row that answers `true` for everyone is dead
 * code someone will eventually delete, so the open surface is stated as a rule instead:
 * **Home, Emergency and Language are open to a guest; everything else needs an account.**
 * Home's individual cards are still gated, by `recordDay` and `browseExercises`.
 */
export type Capability =
  | 'useEmergency'
  | 'changeLanguage'
  | 'recordDay'
  | 'viewHistory'
  | 'useLiv'
  | 'browseExercises'
  | 'useMeditation'
  | 'viewProfessionals'
  | 'viewPlaylists'
  | 'viewCommunity'
  | 'manageProfile'
  | 'subscribe';

/** Why a capability is refused, so a caller can pick the lock icon over the crown. */
export type LockReason = 'auth' | 'premium' | null;

/**
 * The whole access policy, in one table. Adding a screen means adding a row here, not an
 * `if (isGuest)` inside the screen — which is the difference between a rule you can read in
 * ten seconds and twenty call sites that have to agree with each other.
 *
 * `guest` is whether a signed-out visitor may do it. `premium` is whether it additionally
 * costs money, and is unchanged from today's behaviour for a signed-in free user.
 */
export const POLICY: Record<Capability, { guest: boolean; premium: boolean }> = {
  /**
   * Open to guests, and this is not an oversight — it is the one rule this feature exists
   * to protect. VertiGoes is a vestibular-disorder app: someone mid-episode, dizzy and
   * frightened, must never meet a signup wall between them and help. The emergency drawer,
   * the emergency sheet, calling the contact and the whole "Help me through it" flow work
   * signed out. The only concession is that the session is not written to a day record,
   * and that falls out of `recordDay` below rather than being special-cased here.
   */
  useEmergency: { guest: true, premium: false },
  /** A device preference, not account data — and the only way a guest reads the app in Hebrew. */
  changeLanguage: { guest: true, premium: false },

  recordDay: { guest: false, premium: false },
  viewHistory: { guest: false, premium: false },
  useLiv: { guest: false, premium: false },
  browseExercises: { guest: false, premium: false },
  useMeditation: { guest: false, premium: false },
  viewProfessionals: { guest: false, premium: false },
  viewPlaylists: { guest: false, premium: false },
  viewCommunity: { guest: false, premium: true },
  manageProfile: { guest: false, premium: false },
  subscribe: { guest: false, premium: false },
};

/**
 * Auth is checked before Premium, and that ordering *is* the precedence rule: a guest who
 * taps a crowned row is shown the account wall, never the paywall. Selling a subscription to
 * someone with no account to attach it to is two walls in sequence, and `subscribe` is itself
 * behind the first one.
 */
export function reasonFor(
  session: AuthSession,
  isPremium: boolean,
  capability: Capability,
): LockReason {
  const rule = POLICY[capability];
  // `authenticating` is not yet signed in. The 600ms it lasts is short, but a gate that let
  // things through mid-flight would be a race nobody could reproduce.
  if (session.status !== 'authed' && !rule.guest) return 'auth';
  if (rule.premium && !isPremium) return 'premium';
  return null;
}

/** The same answer as `reasonFor`, for callers that only need the boolean. */
export function allows(session: AuthSession, isPremium: boolean, capability: Capability): boolean {
  return reasonFor(session, isPremium, capability) === null;
}

/**
 * One line per capability saying what signing in buys, read by the auth sheet. A bare wall
 * converts badly; the specific promise is what turns a refusal into an offer.
 *
 * The two capabilities a guest already has point at the generic line. They can never open the
 * sheet, so the entry only exists to keep this a total map rather than a partial one that
 * every reader has to null-check.
 */
export const UNLOCK_LINE: Record<Capability, TKey> = {
  useEmergency: 'auth.unlock.generic',
  changeLanguage: 'auth.unlock.generic',
  recordDay: 'auth.unlock.recordDay',
  viewHistory: 'auth.unlock.viewHistory',
  useLiv: 'auth.unlock.useLiv',
  browseExercises: 'auth.unlock.browseExercises',
  useMeditation: 'auth.unlock.useMeditation',
  viewProfessionals: 'auth.unlock.viewProfessionals',
  viewPlaylists: 'auth.unlock.viewPlaylists',
  viewCommunity: 'auth.unlock.viewCommunity',
  manageProfile: 'auth.unlock.manageProfile',
  subscribe: 'auth.unlock.subscribe',
};

/** What the sheet says when it was opened by the Menu rather than by a refused tap. */
export const UNLOCK_LINE_GENERIC: TKey = 'auth.unlock.generic';

export type Capabilities = {
  can: (capability: Capability) => boolean;
  reasonFor: (capability: Capability) => LockReason;
};

/**
 * The policy with this session's answers already filled in — the read half of the gate, which
 * is all a screen needs to decide between a caret and a lock. The write half (opening the
 * sheet, remembering what the tap was for) lives in `AuthGateContext`, which builds on this.
 *
 * A hook in `src/data` is a departure from the folder's usual no-React rule, but splitting the
 * table from the one-line hook that reads it would put two halves of the same answer in two
 * files, and the plain functions above are still there for anything without a hook to call.
 */
export function useCapabilities(): Capabilities {
  const { session } = useAuth();
  const { isPremium } = useSubscription();

  return useMemo(
    () => ({
      can: (capability: Capability) => allows(session, isPremium, capability),
      reasonFor: (capability: Capability) => reasonFor(session, isPremium, capability),
    }),
    [session, isPremium],
  );
}
