/**
 * Guest mode and authentication: the sheet every locked tap opens, the two email screens, the
 * validation messages, and the account rows in the Menu.
 *
 * Its own namespace rather than a corner of `flows`, because this copy is rendered from a
 * sheet, two screens, the tab bar, the Menu and the onboarding header — there is no one screen
 * that owns it, and `common` is deliberately kept tiny.
 *
 * Two rules the copy here has to keep. First, nothing may imply an account exists or that a
 * password is protected: every surface that takes input carries a `demo` line, in the voice of
 * `flows.checkout.legal`. Second, no wall mentions Premium — a guest is being asked for one
 * thing, and asking for two at once is how a funnel dies.
 */
export const auth = {
  /** The bottom sheet. Its subtitle is whichever `unlock` line the refused tap asked for. */
  sheet: {
    title: 'Sign in to VertiGoes',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    email: 'Continue with email',
    signingIn: 'Signing in…',
    demo: 'Demo - no real account is created. Nothing is sent anywhere, and everything resets when you reload.',
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
    /** Also explains why every attempt succeeds, which otherwise reads as a bug. */
    demo: 'Demo - any email and password will do. Nothing is checked and nothing is stored.',
    cta: 'Sign in',
    switchPrompt: 'New here?',
    switchCta: 'Create an account',
  },

  /** Shown against the field that is wrong, never as a summary at the top. */
  error: {
    emailRequired: 'Enter your email address.',
    email: 'Enter an email address like name@example.com.',
    passwordRequired: 'Enter your password.',
    passwordShort: 'Use at least {min} characters.',
    passwordMismatch: 'The two passwords do not match.',
    consent: 'Please agree to the disclaimers to continue.',
    /** The double-submit backstop. Reachable only if a button forgets its disabled state. */
    inProgress: 'Already signing in - give it a moment.',
  },

  /** The skip control and what it leaves behind. Lives here, not in `flows.onboarding`. */
  onboarding: {
    skip: 'Skip',
    a11ySkip: 'Skip for now and finish later from the menu',
    resumeTitle: 'Finish setting up',
    resumeBody:
      'A few medical questions help us tailor your exercises and your emergency steps.',
    resumeCta: 'Continue',
    /** Sits in the Personal information row's trailing slot while the answers are missing. */
    percentComplete: '{percent}% complete',
    /** Under the resume card's donut chart, counting down instead of up. */
    stepsLeft: {
      one: '{count} step left',
      other: '{count} steps left',
    },
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
    accountApple: 'Apple account',
  },

  a11y: {
    lockedRow: '{label} - requires an account',
    lockedTab: 'Requires an account. Opens sign in.',
    signingIn: 'Signing in',
    /** The disclaimer checkbox announces its own state; this is the label beside it. */
    consentCheckbox: 'Agree to the medical and legal disclaimers and the privacy policy',
  },
} as const;
