import type { NamespaceOf } from '../index';

/**
 * TODO(i18n): not translated yet. Every value below is the English string, held here so a
 * translator has one file with the whole auth surface in it rather than hunting the keys out
 * of the English tree.
 *
 * `satisfies` rather than an annotation: it checks each key against the English tree while
 * keeping the literal types, so a misspelt or misplaced key fails here rather than silently
 * resolving to English at runtime.
 */
export const auth = {
  sheet: {
    title: 'Sign in to VertiGoes',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    email: 'Continue with email',
    signingIn: 'Signing in…',
    demo: 'Demo - no real account is created. Nothing is sent anywhere, and everything resets when you reload.',
  },

  unlock: {
    generic: 'An account keeps your track record, opens the exercises, and lets Liv follow your day.',
    recordDay: 'Sign in to keep a record of how you felt, slept and moved each day.',
    viewHistory: 'Sign in and your days start filling in a calendar you can look back on.',
    useLiv: 'Sign in and Liv can follow your day and answer questions about it.',
    browseExercises: 'Sign in to open the exercise videos and get a set that fits your day.',
    useMeditation: 'Sign in to open the meditation drills.',
    viewProfessionals: 'Sign in to see vestibular professionals and their details.',
    viewPlaylists: 'Sign in to open the relief playlists.',
    viewCommunity: 'Sign in to reach the community.',
    manageProfile: 'Sign in to save your medical details and your emergency contact.',
    subscribe: 'Sign in first - a subscription needs an account to belong to.',
  },

  signUp: {
    title: 'Create your account',
    subtitle: 'One account holds your track record, your exercises and your emergency details.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least {min} characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Type it again',
    consent: 'I agree to the medical and legal disclaimers and the privacy policy.',
    linkDisclaimers: 'Read the medical and legal disclaimers',
    linkPrivacy: 'Read the privacy policy',
    disclaimersTitle: 'Medical and legal disclaimers',
    disclaimersNote:
      'The medical and legal disclaimers have not been written yet. They will be here before anyone can create a real account.',
    privacyTitle: 'Privacy policy',
    privacyNote:
      'The privacy policy has not been written yet. It will be here before anyone can create a real account.',
    demo: "Demo - this form goes nowhere. Your password is not stored, sent or checked. Don't use a real one.",
    cta: 'Create account',
    switchPrompt: 'Already have an account?',
    switchCta: 'Sign in',
  },

  signIn: {
    title: 'Sign in',
    subtitle: 'Back to your record, your exercises and Liv.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    demo: 'Demo - any email and password will do. Nothing is checked and nothing is stored.',
    cta: 'Sign in',
    switchPrompt: 'New here?',
    switchCta: 'Create an account',
  },

  error: {
    emailRequired: 'Enter your email address.',
    email: 'Enter an email address like name@example.com.',
    passwordRequired: 'Enter your password.',
    passwordShort: 'Use at least {min} characters.',
    passwordMismatch: 'The two passwords do not match.',
    consent: 'Please agree to the disclaimers to continue.',
    inProgress: 'Already signing in - give it a moment.',
  },

  onboarding: {
    skip: 'Skip',
    a11ySkip: 'Skip for now and finish later from the menu',
    resumeTitle: 'Finish setting up',
    resumeBody: 'A few medical questions tailor your exercises and emergency steps.',
    resumeCta: 'Continue',
    percentComplete: '{percent}%',
  },

  menu: {
    rowSignIn: 'Sign in or create an account',
    guestCardTitle: "You're browsing as a guest",
    guestCardBody: 'Emergency help works either way. Everything else needs an account.',
    guestCardCta: 'Sign in',
    accountLabel: 'Account',
    accountGuest: 'Guest',
    accountGoogle: 'Google account',
    accountApple: 'Apple account',
  },

  a11y: {
    lockedRow: '{label} - requires an account',
    lockedTab: 'Requires an account. Opens sign in.',
    signingIn: 'Signing in',
    consentCheckbox: 'Agree to the medical and legal disclaimers and the privacy policy',
  },
} satisfies NamespaceOf<'auth'>;
