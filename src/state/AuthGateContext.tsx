import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { useCapabilities, type Capability, type LockReason } from '../data/access';

/**
 * What the visitor was reaching for when the wall went up, replayed verbatim once they are
 * through. A closure rather than a serialisable route: `gate` already holds the exact action,
 * so there is no route table to keep in sync and it works for things that are not navigation.
 * The usual objection - a closure does not survive a reload - does not apply here, since
 * nothing in this feature survives a reload by design.
 */
type PendingIntent = { capability: Capability; run: () => void };

/** `capability` is null when the Menu opened the sheet directly rather than a refused tap. */
type SheetState = { visible: boolean; capability: Capability | null };

type AuthGateValue = {
  /** For rendering: is this allowed right now. */
  can: (capability: Capability) => boolean;
  /** Why it is refused, so a row can pick the lock over the crown. Auth wins over premium. */
  reasonFor: (capability: Capability) => LockReason;

  /**
   * Wraps a handler. Allowed, or refused only for money, and you get `action` back untouched -
   * a premium refusal is the caller's own business, and every caller already passes the action
   * that suits its tier. Refused for auth and you get a handler that remembers the intent,
   * opens the sheet, and does not run `action`.
   *
   * A wrapper rather than a `guard(cap): boolean` you branch on: it cannot be written backwards
   * the way `if (!guard(x))` can, it is one line instead of three, and - decisively - it is
   * already holding the action, so the replay above costs nothing.
   *
   * Only for actions the shell can re-run later: `push`, `changeTab`, a context method. A
   * screen's own `setState` must not go in here, because the screen can unmount between the
   * refusal and the replay - use `promptAuth` for those.
   */
  gate: (capability: Capability, action: () => void) => () => void;

  /** Opens the sheet for a capability, remembering nothing. The in-place half of `gate`. */
  promptAuth: (capability: Capability) => void;
  /** The Menu's sign-in row: the sheet with no particular thing behind it. */
  promptSignIn: () => void;

  /** The visitor backed out. Drops the intent with the sheet - see the note on `hideSheet`. */
  closeSheet: () => void;
  /**
   * Hides the sheet while keeping the intent, for the one case that is not a dismissal: the
   * "Continue with email" hand-off to the sign-up screen, which is the middle of the same ask.
   */
  hideSheet: () => void;

  /** Returns the stored action and clears it, so a replay can never fire twice. */
  consumeIntent: () => (() => void) | null;

  sheet: SheetState;
  reset: () => void;
};

const CLOSED: SheetState = { visible: false, capability: null };

const AuthGateContext = createContext<AuthGateValue | null>(null);

/**
 * The write half of the access gate: what a refused tap does.
 *
 * `data/access.ts` answers whether something is allowed; this owns what happens when it is not.
 * One provider so there is exactly one sheet, one piece of visibility state and one pending
 * intent in the app - three copies of that in three screens is precisely the drift the
 * `EmergencySheet` and `BottomSheet` file comments warn about.
 *
 * It knows nothing about routes. The shell renders the sheet and supplies the handlers, the
 * same division `EmergencySheet` already has.
 */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { can, reasonFor } = useCapabilities();

  const [sheet, setSheet] = useState<SheetState>(CLOSED);
  /** A ref, not state: nothing renders the intent, and a replay must see the latest write. */
  const intent = useRef<PendingIntent | null>(null);

  const gate = useCallback(
    (capability: Capability, action: () => void) => () => {
      if (reasonFor(capability) !== 'auth') {
        action();
        return;
      }
      intent.current = { capability, run: action };
      setSheet({ visible: true, capability });
    },
    [reasonFor],
  );

  const promptAuth = useCallback((capability: Capability) => {
    intent.current = null;
    setSheet({ visible: true, capability });
  }, []);

  const promptSignIn = useCallback(() => {
    intent.current = null;
    setSheet({ visible: true, capability: null });
  }, []);

  const closeSheet = useCallback(() => {
    // An intent that outlived the ask would fire much later off an unrelated sign-in, and the
    // app would look like it had decided to navigate by itself.
    intent.current = null;
    setSheet(CLOSED);
  }, []);

  const hideSheet = useCallback(() => setSheet(CLOSED), []);

  const consumeIntent = useCallback(() => {
    const pending = intent.current;
    intent.current = null;
    return pending ? pending.run : null;
  }, []);

  const value = useMemo<AuthGateValue>(
    () => ({
      can,
      reasonFor,
      gate,
      promptAuth,
      promptSignIn,
      closeSheet,
      hideSheet,
      consumeIntent,
      sheet,
      reset: closeSheet,
    }),
    [can, reasonFor, gate, promptAuth, promptSignIn, closeSheet, hideSheet, consumeIntent, sheet],
  );

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>;
}

export function useGate() {
  const value = useContext(AuthGateContext);
  if (!value) throw new Error('useGate must be used inside an AuthGateProvider');
  return value;
}
