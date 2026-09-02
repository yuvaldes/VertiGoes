import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { TKey, TParams } from '../i18n';
import type { OnboardingAnswers } from '../data/onboarding';

/**
 * How long the mock pretends to talk to a server. Without it `authenticating` would never be
 * observable and the provider buttons' spinner would be dead code — which is the state the
 * real thing spends the most time in, so it is the one worth being able to look at.
 */
export const MOCK_AUTH_DELAY_MS = 600;

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Deliberately loose. A stricter pattern rejects addresses that are perfectly valid (plus
 * tags, new TLDs, unicode locals) and the only thing that can actually confirm an address is
 * a mail round trip, which this mock cannot do.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type AuthMethod = 'google' | 'apple' | 'email';

/**
 * Three values rather than a boolean, because the shell has to tell "never offered" from
 * "offered and declined": `pending` is its cue to push onboarding exactly once after sign-in,
 * `skipped` its cue to stop pushing and let the Menu's resume card carry it instead.
 */
export type OnboardingStatus = 'pending' | 'skipped' | 'complete';

export type Account = {
  /** Minted at sign-in and stable for the session. There is nothing behind it. */
  id: string;
  /** Null for the wallet providers — the mock never learns an address from them. */
  email: string | null;
  method: AuthMethod;
};

export type AuthSession =
  | { status: 'guest' }
  | { status: 'authenticating'; method: AuthMethod }
  | {
      status: 'authed';
      account: Account;
      onboarding: OnboardingStatus;
      /** Non-null only when `onboarding === 'complete'`. The two move together. */
      answers: OnboardingAnswers | null;
      /** Non-null only when `onboarding === 'skipped'` — how many steps they'd finished. */
      progressStep: number | null;
    };

/** Which field an error belongs against. `form` is the whole-form fallback. */
export type AuthField = 'email' | 'password' | 'confirm' | 'consent' | 'form';

/**
 * A key plus its params rather than a bare `TKey`: `auth.error.passwordShort` interpolates
 * `{min}`, and a screen that resolved it with `t(key)` alone would render the placeholder and
 * warn. Carrying the params with the key means no call site has to remember which errors take
 * one — `t(error.key, error.params)` is right for all of them.
 */
export type AuthError = { key: TKey; params?: TParams };

export type FieldErrors = Partial<Record<AuthField, AuthError>>;

export type AuthResult = { ok: true } | { ok: false; errors: FieldErrors };

export type SignUpForm = {
  email: string;
  password: string;
  confirm: string;
  acceptedDisclaimers: boolean;
};

export type SignInForm = { email: string; password: string };

/**
 * Pure and synchronous so a screen can re-validate a field on change without awaiting
 * anything, and so the context can run the very same function as the last gate before it
 * changes state. A refused sign-up is an expected outcome, not an exception.
 */
export function validateSignUp(form: SignUpForm): FieldErrors {
  const errors: FieldErrors = {};

  if (form.email.trim().length === 0) errors.email = { key: 'auth.error.emailRequired' };
  else if (!EMAIL_SHAPE.test(form.email.trim())) errors.email = { key: 'auth.error.email' };

  if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = { key: 'auth.error.passwordShort', params: { min: MIN_PASSWORD_LENGTH } };
  }

  // Against `confirm`, not `password`: the field the user has to change is the second one.
  if (form.confirm !== form.password) errors.confirm = { key: 'auth.error.passwordMismatch' };

  if (!form.acceptedDisclaimers) errors.consent = { key: 'auth.error.consent' };

  return errors;
}

/** Shape and presence only. Signing in never asks for the disclaimers again. */
export function validateSignIn(form: SignInForm): FieldErrors {
  const errors: FieldErrors = {};

  if (form.email.trim().length === 0) errors.email = { key: 'auth.error.emailRequired' };
  else if (!EMAIL_SHAPE.test(form.email.trim())) errors.email = { key: 'auth.error.email' };

  if (form.password.length === 0) errors.password = { key: 'auth.error.passwordRequired' };

  return errors;
}

type AuthValue = {
  session: AuthSession;

  // Derived once here so that no screen re-derives them slightly differently.
  isGuest: boolean;
  isAuthed: boolean;
  isAuthenticating: boolean;
  account: Account | null;
  /** Null while guest. */
  onboarding: OnboardingStatus | null;
  /** True while the medical answers are not in hand — `'pending'` or `'skipped'`. */
  needsOnboarding: boolean;

  signInWithProvider: (method: 'google' | 'apple') => Promise<AuthResult>;
  /** Validates first. The password is compared, length-checked and dropped on this line. */
  signUpWithEmail: (form: SignUpForm) => Promise<AuthResult>;
  signInWithEmail: (form: SignInForm) => Promise<AuthResult>;

  completeOnboarding: (answers: OnboardingAnswers) => void;
  skipOnboarding: (step: number) => void;

  signOut: () => void;
};

const GUEST: AuthSession = { status: 'guest' };

const AuthContext = createContext<AuthValue | null>(null);

let idCounter = 0;

/** Unique within the session, which is as long as anything here lives. */
function mintId(): string {
  idCounter += 1;
  return `acct-${Date.now().toString(36)}-${idCounter}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function signedIn(account: Account): AuthSession {
  // Every sign-in lands in `pending`, including sign *in*: nothing persists between reloads,
  // so a returning user is a fiction this mock cannot honour. Claiming `complete` with no
  // answers behind it would split the status flag from the data it describes.
  return { status: 'authed', account, onboarding: 'pending', answers: null, progressStep: null };
}

/**
 * Who is using the app, and whether they have finished the medical questions.
 *
 * Mocked end to end, exactly like `SubscriptionContext`: signing in is a `setTimeout` and a
 * state flip, and everything is gone on reload. It is a context rather than a prop because
 * the answer is read from the tab bar, the Menu, every gate and the emergency writes, and a
 * second copy of it anywhere would drift.
 *
 * It knows nothing about routes or capabilities. It answers "who is this"; `data/access.ts`
 * answers "what may they do", and the shell owns where a refused tap goes.
 *
 * The password is an argument to `signUpWithEmail`/`signInWithEmail` and nothing more. It is
 * never held in state, never returned, never logged, and never reaches `Account` — the same
 * discipline `CheckoutScreen` applies by keeping only a card's last four digits.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(GUEST);

  // A ref rather than reading `session`, because two taps inside one tick both see the old
  // state. The screens disable their buttons while authenticating; this is the backstop.
  const busy = useRef(false);

  const runMockSignIn = useCallback(
    async (method: AuthMethod, email: string | null): Promise<AuthResult> => {
      if (busy.current) return { ok: false, errors: { form: { key: 'auth.error.inProgress' } } };
      busy.current = true;

      setSession({ status: 'authenticating', method });
      await wait(MOCK_AUTH_DELAY_MS);
      setSession(signedIn({ id: mintId(), email, method }));

      busy.current = false;
      return { ok: true };
    },
    [],
  );

  const signInWithProvider = useCallback(
    (method: 'google' | 'apple') => runMockSignIn(method, null),
    [runMockSignIn],
  );

  const signUpWithEmail = useCallback(
    async (form: SignUpForm): Promise<AuthResult> => {
      const errors = validateSignUp(form);
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      // `form.password` goes no further than the validator above.
      return runMockSignIn('email', form.email.trim().toLowerCase());
    },
    [runMockSignIn],
  );

  const signInWithEmail = useCallback(
    async (form: SignInForm): Promise<AuthResult> => {
      const errors = validateSignIn(form);
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      // Any credentials are accepted — there is nothing to check them against, and the screen
      // says so in `auth.signIn.demo` rather than letting it read as a bug.
      return runMockSignIn('email', form.email.trim().toLowerCase());
    },
    [runMockSignIn],
  );

  const completeOnboarding = useCallback((answers: OnboardingAnswers) => {
    setSession((current) =>
      current.status === 'authed'
        ? { ...current, onboarding: 'complete', answers, progressStep: null }
        : current,
    );
  }, []);

  /**
   * `step` is how many of the wizard's steps were already behind them when they backed out —
   * the Menu's "Personal information" row turns that into a percentage. Answers stay null:
   * only a finished run hands those over, so resuming from the Menu restarts the wizard
   * cleanly rather than half-filled.
   */
  const skipOnboarding = useCallback((step: number) => {
    setSession((current) =>
      current.status === 'authed'
        ? { ...current, onboarding: 'skipped', answers: null, progressStep: step }
        : current,
    );
  }, []);

  /**
   * Drops the account only. The rest of the account-shaped state — plan, day records, Liv
   * threads, today's exercises — is reset by the shell in one explicit handler, because four
   * effects watching this value would race each other and the provider swap.
   */
  const signOut = useCallback(() => {
    busy.current = false;
    setSession(GUEST);
  }, []);

  const value = useMemo<AuthValue>(() => {
    const onboarding = session.status === 'authed' ? session.onboarding : null;
    return {
      session,
      isGuest: session.status === 'guest',
      isAuthed: session.status === 'authed',
      isAuthenticating: session.status === 'authenticating',
      account: session.status === 'authed' ? session.account : null,
      onboarding,
      needsOnboarding: onboarding === 'pending' || onboarding === 'skipped',
      signInWithProvider,
      signUpWithEmail,
      signInWithEmail,
      completeOnboarding,
      skipOnboarding,
      signOut,
    };
  }, [
    session,
    signInWithProvider,
    signUpWithEmail,
    signInWithEmail,
    completeOnboarding,
    skipOnboarding,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider');
  return value;
}
