import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { TKey, TParams } from '../i18n';
import type { OnboardingAnswers } from '../data/onboarding';
import { supabase } from '../lib/supabase';
import { CAPTCHA_REQUIRED } from '../lib/authConfig';
import { LEGAL_VERSION } from '../data/legal';

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export type AuthMethod = 'google' | 'email';
export type OnboardingStatus = 'pending' | 'skipped' | 'complete';
export type Account = { id: string; email: string | null; method: AuthMethod };
export type AuthSession =
  | { status: 'guest' }
  | { status: 'authenticating'; method: AuthMethod }
  | {
      status: 'authed'; account: Account; onboarding: OnboardingStatus;
      answers: OnboardingAnswers | null; progressStep: number | null;
      consentsCurrent: boolean;
    };
export type AuthField = 'email' | 'password' | 'confirm' | 'consent' | 'form';
export type AuthError = { key: TKey; params?: TParams };
export type FieldErrors = Partial<Record<AuthField, AuthError>>;
export type AuthResult =
  | { ok: true; confirmationRequired?: boolean; cancelled?: boolean }
  | { ok: false; errors: FieldErrors };
export type SignUpForm = {
  email: string; password: string; confirm: string;
  acceptedMedicalDisclaimer: boolean; acceptedHealthData: boolean;
  captchaToken?: string;
};
export type SignInForm = { email: string; password: string; captchaToken?: string };

export function validateSignUp(form: SignUpForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.trim()) errors.email = { key: 'auth.error.emailRequired' };
  else if (!EMAIL_SHAPE.test(form.email.trim())) errors.email = { key: 'auth.error.email' };
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = { key: 'auth.error.passwordShort', params: { min: MIN_PASSWORD_LENGTH } };
  }
  if (form.confirm !== form.password) errors.confirm = { key: 'auth.error.passwordMismatch' };
  if (!form.acceptedMedicalDisclaimer || !form.acceptedHealthData) {
    errors.consent = { key: 'auth.error.consent' };
  }
  return errors;
}

export function validateSignIn(form: SignInForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.trim()) errors.email = { key: 'auth.error.emailRequired' };
  else if (!EMAIL_SHAPE.test(form.email.trim())) errors.email = { key: 'auth.error.email' };
  if (!form.password) errors.password = { key: 'auth.error.passwordRequired' };
  return errors;
}

type AuthValue = {
  session: AuthSession;
  isGuest: boolean;
  isAuthed: boolean;
  isAuthenticating: boolean;
  isRestoring: boolean;
  isSavingProfile: boolean;
  account: Account | null;
  onboarding: OnboardingStatus | null;
  needsOnboarding: boolean;
  needsLegalConsent: boolean;
  authError: AuthError | null;
  recoveringPassword: boolean;
  retryProfile: () => void;
  clearAuthError: () => void;
  signInWithProvider: (method: 'google') => Promise<AuthResult>;
  signUpWithEmail: (form: SignUpForm) => Promise<AuthResult>;
  signInWithEmail: (form: SignInForm) => Promise<AuthResult>;
  requestPasswordReset: (email: string, captchaToken?: string) => Promise<AuthResult>;
  resendConfirmation: (email: string, captchaToken?: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  cancelPasswordRecovery: () => void;
  completeOnboarding: (answers: OnboardingAnswers) => Promise<AuthResult>;
  skipOnboarding: (step: number) => Promise<AuthResult>;
  signOut: () => Promise<boolean>;
  deleteAccount: () => Promise<AuthResult>;
  acceptLegalConsents: () => Promise<AuthResult>;
};

const GUEST: AuthSession = { status: 'guest' };
const AuthContext = createContext<AuthValue | null>(null);

function errorKey(error: unknown): TKey {
  const code = (error as { code?: string })?.code;
  if (code === 'invalid_credentials') return 'auth.error.credentials';
  if (code === 'captcha_failed') return 'auth.error.captcha';
  if (code === 'weak_password') return 'auth.error.passwordWeak';
  if (code === 'email_not_confirmed') return 'auth.error.unconfirmed';
  if (code === 'user_already_exists' || code === 'email_exists') return 'auth.error.emailExists';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
    return 'auth.error.rateLimit';
  }
  if (code === 'provider_disabled' || code === 'validation_failed') return 'auth.error.provider';
  return 'auth.error.connection';
}

function accountFor(user: User): Account {
  const provider = user.app_metadata.provider;
  return {
    id: user.id, email: user.email ?? null,
    method: provider === 'google' ? provider : 'email',
  };
}

function redirectUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  return makeRedirectUri({ scheme: 'vertigoes', path: 'auth/callback' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(GUEST);
  const [backendSession, setBackendSession] = useState<Session | null | undefined>(undefined);
  const [isRestoring, setRestoring] = useState(Boolean(supabase));
  const [isSavingProfile, setSavingProfile] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const busy = useRef(false);
  const profileBusy = useRef(false);
  const emailRequestBusy = useRef(false);
  const nextEmailRequestAt = useRef(0);
  const loadedUser = useRef<string | null>(null);
  const currentUser = useRef<string | null>(null);
  const profileSession = useRef<AuthSession>(GUEST);

  const fail = useCallback((key: TKey): AuthResult => {
    setAuthError({ key });
    return { ok: false, errors: { form: { key } } };
  }, []);
  const clearAuthError = useCallback(() => setAuthError(null), []);
  const retryProfile = useCallback(() => {
    loadedUser.current = null;
    setProfileAttempt((attempt) => attempt + 1);
  }, []);

  // Keep auth callbacks synchronous. Supabase requests inside them can deadlock its lock.
  useEffect(() => {
    if (!supabase) { setRestoring(false); return; }
    const client = supabase;
    let active = true;
    // URL processing failures are returned by initialize(), not the auth-state event.
    // Surface them instead of silently returning to a guest session after Google.
    void client.auth.initialize().then(({ error }) => {
      if (active && error) { fail('auth.error.oauthReturn'); setRestoring(false); }
    }).catch(() => {
      if (active) { fail('auth.error.oauthReturn'); setRestoring(false); }
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((event, next) => {
      if (currentUser.current !== (next?.user.id ?? null)) {
        loadedUser.current = null;
        profileSession.current = GUEST;
        setSession(GUEST);
        setRestoring(Boolean(next));
        setAuthError(null);
        setRecoveringPassword(false);
      }
      currentUser.current = next?.user.id ?? null;
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT') setRecoveringPassword(false);
      setBackendSession(next);
    });
    const appState = Platform.OS !== 'web'
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') client.auth.startAutoRefresh();
          else client.auth.stopAutoRefresh();
        })
      : null;
    if (Platform.OS !== 'web' && AppState.currentState === 'active') client.auth.startAutoRefresh();
    return () => {
      active = false;
      subscription.unsubscribe();
      appState?.remove();
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [fail]);

  useEffect(() => {
    if (!supabase || backendSession === undefined) return;
    if (!backendSession) {
      loadedUser.current = null;
      profileSession.current = GUEST;
      setSession(GUEST);
      setRestoring(false);
      return;
    }
    const user = backendSession.user;
    if (loadedUser.current === user.id) return;
    let cancelled = false;
    const client = supabase;
    setRestoring(true);
    const load = async () => {
      try {
        const [result, consentResult] = await Promise.all([
          client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          client.from('legal_consents').select('document_type,document_version')
            .eq('user_id', user.id).eq('document_version', LEGAL_VERSION),
        ]);
        if (cancelled || currentUser.current !== user.id) return;
        if (result.error) throw result.error;
        if (consentResult.error) throw consentResult.error;
        const consentTypes = new Set((consentResult.data ?? []).map((row) => row.document_type));
        const consentsCurrent = consentTypes.has('medical_disclaimer') && consentTypes.has('health_data_processing');
        let profile = result.data;
        if (!profile) {
          const inserted = await client.from('profiles').upsert(
            { id: user.id }, { onConflict: 'id', ignoreDuplicates: true },
          );
          if (cancelled || currentUser.current !== user.id) return;
          if (inserted.error) throw inserted.error;
          const reread = await client.from('profiles').select('*').eq('id', user.id).single();
          if (reread.error) throw reread.error;
          profile = reread.data;
        }
        if (cancelled || currentUser.current !== user.id) return;
        const next: AuthSession = {
          status: 'authed', account: accountFor(user),
          onboarding: profile.onboarding_status,
          answers: profile.answers,
          progressStep: profile.progress_step,
          consentsCurrent,
        };
        loadedUser.current = user.id;
        profileSession.current = next;
        setSession(next);
        setAuthError(null);
      } catch {
        if (!cancelled && currentUser.current === user.id) {
          setSession(GUEST);
          setAuthError({ key: 'auth.error.profileLoad' });
        }
      } finally {
        if (!cancelled && currentUser.current === user.id) setRestoring(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [backendSession, profileAttempt]);

  const acceptNativeCallback = useCallback(async (url: string) => {
    if (!supabase) return false;
    // Do not log callback URLs or tokens, and accept only the app's callback path.
    const expected = redirectUri().split('?')[0];
    if (url.split(/[?#]/)[0] !== expected) return false;
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.hash.slice(1) || parsed.search.slice(1));
    if (params.has('error')) { fail('auth.error.connection'); return false; }
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return false;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) { fail(errorKey(error)); return false; }
    if (params.get('type') === 'recovery') setRecoveringPassword(true);
    return true;
  }, [fail]);

  useEffect(() => {
    if (Platform.OS === 'web' || !supabase) return;
    const handle = (url: string) => {
      void acceptNativeCallback(url).catch(() => fail('auth.error.connection'));
    };
    const subscription = Linking.addEventListener('url', ({ url }) => handle(url));
    void Linking.getInitialURL().then((url) => { if (url) handle(url); })
      .catch(() => fail('auth.error.connection'));
    return () => subscription.remove();
  }, [acceptNativeCallback, fail]);

  const begin = (method: AuthMethod): AuthResult | null => {
    if (!supabase) return fail('auth.error.notConfigured');
    if (busy.current || isRestoring) return fail('auth.error.inProgress');
    busy.current = true;
    setAuthError(null);
    setSession({ status: 'authenticating', method });
    return null;
  };
  const end = () => {
    busy.current = false;
    setSession((value) => value.status === 'authenticating' ? profileSession.current : value);
  };

  const signInWithEmail = async (form: SignInForm): Promise<AuthResult> => {
    const errors = validateSignIn(form);
    if (Object.keys(errors).length) return { ok: false, errors };
    if (CAPTCHA_REQUIRED && !form.captchaToken) return fail('auth.error.captcha');
    const refused = begin('email');
    if (refused || !supabase) return refused!;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(), password: form.password,
        ...(form.captchaToken ? { options: { captchaToken: form.captchaToken } } : {}),
      });
      return error ? fail(errorKey(error)) : { ok: true };
    } catch { return fail('auth.error.connection'); }
    finally { end(); }
  };

  const signUpWithEmail = async (form: SignUpForm): Promise<AuthResult> => {
    const errors = validateSignUp(form);
    if (Object.keys(errors).length) return { ok: false, errors };
    if (CAPTCHA_REQUIRED && !form.captchaToken) return fail('auth.error.captcha');
    const refused = begin('email');
    if (refused || !supabase) return refused!;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { emailRedirectTo: redirectUri(), ...(form.captchaToken ? { captchaToken: form.captchaToken } : {}) },
      });
      return error ? fail(errorKey(error)) : { ok: true, confirmationRequired: !data.session };
    } catch { return fail('auth.error.connection'); }
    finally { end(); }
  };

  const signInWithProvider = async (method: 'google'): Promise<AuthResult> => {
    const refused = begin(method);
    if (refused || !supabase) return refused!;
    try {
      const redirectTo = redirectUri();
      if (Platform.OS !== 'web' && /^exps?:\/\//.test(redirectTo)) {
        return fail('auth.error.oauthUseWeb');
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: method, options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) return fail(error ? errorKey(error) : 'auth.error.provider');
      if (Platform.OS === 'web') {
        window.location.assign(data.url);
        return { ok: true, cancelled: true };
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return { ok: true, cancelled: true };
      const accepted = await acceptNativeCallback(result.url);
      return accepted ? { ok: true } : fail('auth.error.connection');
    } catch { return fail('auth.error.connection'); }
    finally { end(); }
  };

  const sendAccountEmail = async (kind: 'recovery' | 'signup', email: string, captchaToken?: string): Promise<AuthResult> => {
    const error = validateSignIn({ email, password: 'unused' }).email;
    if (error) return { ok: false, errors: { email: error } };
    if (!supabase) return fail('auth.error.notConfigured');
    if (CAPTCHA_REQUIRED && !captchaToken) return fail('auth.error.captcha');
    if (emailRequestBusy.current) return fail('auth.error.inProgress');
    if (Date.now() < nextEmailRequestAt.current) return fail('auth.error.emailCooldown');
    emailRequestBusy.current = true;
    nextEmailRequestAt.current = Date.now() + 60_000;
    try {
      const challenge = captchaToken ? { captchaToken } : {};
      const { error } = kind === 'recovery'
        ? await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUri(), ...challenge })
        : await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectUri(), ...challenge } });
      // Do not disclose whether an address exists or is already confirmed.
      if (error && ['user_not_found', 'email_not_confirmed', 'email_already_confirmed'].includes(error.code ?? '')) return { ok: true };
      return error ? fail(errorKey(error)) : { ok: true };
    } catch { return fail('auth.error.connection'); }
    finally { emailRequestBusy.current = false; }
  };
  const requestPasswordReset = (email: string, captchaToken?: string) => sendAccountEmail('recovery', email, captchaToken);
  const resendConfirmation = (email: string, captchaToken?: string) => sendAccountEmail('signup', email, captchaToken);

  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, errors: {
        password: { key: 'auth.error.passwordShort', params: { min: MIN_PASSWORD_LENGTH } },
      } };
    }
    if (!supabase) return fail('auth.error.notConfigured');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return fail(errorKey(error));
      setRecoveringPassword(false);
      return { ok: true };
    } catch { return fail('auth.error.connection'); }
  };

  const saveProfile = async (
    onboarding: OnboardingStatus, answers: OnboardingAnswers | null, progressStep: number | null,
  ): Promise<AuthResult> => {
    const current = profileSession.current;
    if (!supabase || current.status !== 'authed') return fail('auth.error.connection');
    if (profileBusy.current) return fail('auth.error.inProgress');
    profileBusy.current = true;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: current.account.id, onboarding_status: onboarding, answers, progress_step: progressStep,
      });
      if (currentUser.current !== current.account.id) {
        return { ok: false, errors: { form: { key: 'auth.error.connection' } } };
      }
      if (error) return fail(error.code === 'PT429' ? 'auth.error.rateLimit' :
        error.code === '22023' ? 'auth.error.profileInvalid' : 'auth.error.profileSave');
      const next = { ...current, onboarding, answers, progressStep };
      profileSession.current = next;
      setSession(next);
      setAuthError(null);
      return { ok: true };
    } catch {
      if (currentUser.current !== current.account.id) {
        return { ok: false, errors: { form: { key: 'auth.error.connection' } } };
      }
      return fail('auth.error.profileSave');
    }
    finally { profileBusy.current = false; setSavingProfile(false); }
  };

  const acceptLegalConsents = async (): Promise<AuthResult> => {
    const current = profileSession.current;
    if (!supabase || current.status !== 'authed') return fail('auth.error.connection');
    const rows = ['medical_disclaimer', 'health_data_processing'].map((document_type) => ({
      user_id: current.account.id, document_type, document_version: LEGAL_VERSION,
    }));
    try {
      const { error } = await supabase.from('legal_consents').insert(rows);
      if (error && error.code !== '23505') return fail('auth.error.connection');
      const next = { ...current, consentsCurrent: true };
      profileSession.current = next;
      setSession(next);
      return { ok: true };
    } catch { return fail('auth.error.connection'); }
  };

  const signOut = async () => {
    if (!supabase) return true;
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) { fail('auth.error.connection'); return false; }
      setAuthError(null);
      return true;
    } catch { fail('auth.error.connection'); return false; }
  };

  const deleteAccount = async (): Promise<AuthResult> => {
    if (!supabase || session.status !== 'authed') return fail('auth.error.deleteAccount');
    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) return fail('auth.error.deleteAccount');
      await supabase.auth.signOut({ scope: 'local' });
      setBackendSession(null);
      setSession(GUEST);
      setAuthError(null);
      return { ok: true };
    } catch {
      return fail('auth.error.deleteAccount');
    }
  };

  const onboarding = session.status === 'authed' ? session.onboarding : null;
  const value: AuthValue = {
    session,
    isGuest: session.status !== 'authed',
    isAuthed: session.status === 'authed',
    isAuthenticating: session.status === 'authenticating' || isRestoring,
    isRestoring, isSavingProfile, authError, recoveringPassword,
    account: session.status === 'authed' ? session.account : null,
    onboarding, needsOnboarding: onboarding === 'pending' || onboarding === 'skipped',
    needsLegalConsent: session.status === 'authed' && !session.consentsCurrent,
    retryProfile, clearAuthError, signInWithProvider, signUpWithEmail, signInWithEmail,
    requestPasswordReset, resendConfirmation, updatePassword,
    cancelPasswordRecovery: () => setRecoveringPassword(false),
    completeOnboarding: (answers) => saveProfile('complete', answers, null),
    skipOnboarding: (step) => saveProfile('skipped', null, step),
    signOut, deleteAccount, acceptLegalConsents,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider');
  return value;
}
