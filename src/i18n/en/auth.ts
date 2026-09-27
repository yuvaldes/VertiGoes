/**
 * Guest mode and authentication: the sheet every locked tap opens, the two email screens, the
 * validation messages, and the account rows in the Menu.
 *
 * Its own namespace rather than a corner of `flows`, because this copy is rendered from a
 * sheet, two screens, the tab bar, the Menu and the onboarding header — there is no one screen
 * that owns it, and `common` is deliberately kept tiny.
 *
 * Authentication messages describe real Supabase accounts. Premium is a separate flow.
 */
export const auth = {
  /** The bottom sheet. Its subtitle is whichever `unlock` line the refused tap asked for. */
  sheet: {
    title: 'Sign in to VertiGoes',
    google: 'Continue with Google',
    email: 'Continue with email',
    signingIn: 'Signing in…',
    demo: "Sign in to save your progress across devices.",
  },

  /**
   * One line per capability, saying what this particular tap would have opened. Keyed to
   * match `Capability` in `src/data/access.ts`; `UNLOCK_LINE` there is the lookup.
   */
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
    /**
     * The checkbox label is one plain sentence, and the two documents are separate links
     * underneath it. Pressable spans inside a translated sentence cannot survive Hebrew word
     * order, and a label that is partly a link makes "read the policy" toggle the box.
     */
    consent: 'I agree to the medical and legal disclaimers and the privacy policy.',
    linkDisclaimers: 'Read the medical and legal disclaimers',
    linkPrivacy: 'Read the privacy policy',
    /** Both links open the placeholder screen, which is the honest answer for now. */
    disclaimersTitle: 'Medical and legal disclaimers',
    disclaimersNote:
      'The medical and legal disclaimers have not been written yet. They are not available yet.',
    privacyTitle: 'Privacy policy',
    privacyNote:
      'The privacy policy has not been written yet. It is not available yet.',
    demo: "You may need to confirm your email before signing in.",
    confirmation: "Check your email to confirm your account, then sign in.",
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
    /** Also explains why every attempt succeeds, which otherwise reads as a bug. */
    demo: "Use the email and password for your account.",
    forgot: "Forgot password?",
    resetSent: "If this address has an account, a password-reset link is on its way.",
    cta: 'Sign in',
    switchPrompt: 'New here?',
    switchCta: 'Create an account',
  },

  /** Shown against the field that is wrong, never as a summary at the top. */
  status: {
    syncError: 'Some records could not be saved or loaded. Retry before closing the app.',
    saving: "Saving…",
    restoring: "Restoring your account…",
    retry: "Try again",
  },
  resetPassword: {
    title: "Choose a new password",
    body: "Enter a new password for your account.",
    cta: "Save password",
  },

  captcha: {
    label: 'Security check',
    failed: 'The security check could not load. Please try again.',
    useWeb: 'Please use the web app to complete the security check.',
  },
  error: {
    oauthReturn: 'Sign-in could not finish. Try again from the same browser. If it keeps happening, the sign-in return address may need updating.',
    oauthUseWeb: 'Google sign-in needs the web app or an installed development build. Open the web app in your browser to sign in.',
    captcha: 'Complete the security check and try again.',
    passwordWeak: 'Choose a stronger password with a mix of letters, numbers, and symbols.',
    emailCooldown: 'Please wait a minute before requesting another email.',
    notConfigured: "Sign-in is not available yet. Please try again later.",
    credentials: "The email or password is incorrect.",
    unconfirmed: "Confirm your email before signing in.",
    emailExists: "Try signing in with this email or resetting your password.",
    rateLimit: "Too many attempts. Please wait a few minutes and try again.",
    provider: "This sign-in provider is not available. Please use email.",
    connection: "Could not connect. Check your connection and try again.",
    profileLoad: "Your account details could not be loaded. Please try again.",
    profileSave: "Your changes could not be saved. Please try again.",
    profileInvalid: 'Some answers are invalid or too long. Please check your details and try again.',
    emailRequired: 'Enter your email address.',
    email: 'Enter an email address like name@example.com.',
    passwordRequired: 'Enter your password.',
    passwordShort: 'Use at least {min} characters.',
    passwordMismatch: 'The two passwords do not match.',
    consent: 'Please agree to the disclaimers to continue.',
    /** The double-submit backstop. Reachable only if a button forgets its disabled state. */
    inProgress: 'Already signing in - give it a moment.',
    deleteAccount: 'We could not delete your account. Please try again.',
  },

  /** The skip control and what it leaves behind. Lives here, not in `flows.onboarding`. */
  onboarding: {
    skip: 'Skip',
    a11ySkip: 'Skip for now and finish later from the menu',
    resumeTitle: 'Finish setting up',
    resumeBody: 'A few medical questions tailor your exercises and emergency steps.',
    resumeCta: 'Continue',
    /** Sits in the Personal information row's trailing slot while the answers are missing. */
    percentComplete: '{percent}%',
  },

  menu: {
    rowSignIn: 'Sign in or create an account',
    guestCardTitle: "You're browsing as a guest",
    guestCardBody: 'Emergency help works either way. Everything else needs an account.',
    guestCardCta: 'Sign in',
    /** Trailing value on the account row: an email if there is one, the provider if not. */
    accountLabel: 'Account',
    accountGuest: 'Guest',
    accountGoogle: 'Google account',
  },

  deleteAccount: {
    row: 'Delete account',
    title: 'Delete your account?',
    body: 'This permanently deletes your account, medical answers, and calendar history. This cannot be undone.',
    retention: 'Submitted bug reports are anonymized: your account link and message are removed, while technical details such as platform, app version, status, and date are retained.',
    confirm: 'Delete permanently',
    deleting: 'Deleting…',
  },

  a11y: {
    lockedRow: '{label} - requires an account',
    lockedTab: 'Requires an account. Opens sign in.',
    signingIn: 'Signing in',
    /** The disclaimer checkbox announces its own state; this is the label beside it. */
    consentCheckbox: 'Agree to the medical and legal disclaimers and the privacy policy',
  },
} as const;
