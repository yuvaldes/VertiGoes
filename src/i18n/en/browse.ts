/**
 * The browse half of the app: Liv's tab root, the Menu tab, and everything reachable from it —
 * meditation drills, the exercise library, the professionals directory and its detail page,
 * plus the shared "not built yet" screen.
 *
 * The drills, exercises and professionals themselves are not here. Those are directory
 * content and belong to `data`; these screens frame them, they do not author them.
 */
export const browse = {
  liv: {
    title: 'Liv',
    voiceReplying: 'Liv is replying…',
    voiceMuted: 'Muted',
    voiceListening: 'Listening… (simulated, no audio recorded)',
  },
  menu: {
    title: 'Menu',
    rowMeditation: 'Meditation drills',
    rowExercises: 'Exercises',
    rowProfessionals: 'Professionals',
    rowPlaylists: 'Relief playlists',
    playlistsNote: 'Calming playlists will open in your music app once the links are set up.',
    rowCommunity: 'Community',
    communityNote: 'The community feed and groups will live here.',
    rowPersonalInfo: 'Personal information',
    rowSymptoms: 'My symptoms',
    symptomsNote:
      'The symptoms you report during onboarding will be listed and editable here.',
    rowSubscription: 'Subscription',
    planPremium: 'Premium',
    planFree: 'Free',
    rowLanguage: 'Language',
    rowSignOut: 'Sign out',
    languageSheetTitle: 'Language',
    /**
     * Native only, and about the layout rather than the language: the text changes at once,
     * but the process was laid out left-to-right at launch and cannot turn around mid-session.
     */
    restartNotice:
      'Your language is saved. Close and reopen the app to switch the layout direction.',
  },
  meditation: {
    title: 'Meditation drills',
    a11yCard: '{title}, {duration}',
    gateItemLabel: 'drills',
    gateBody: 'Upgrade to Premium to unlock every breathing and grounding drill.',
  },
  library: {
    title: 'Exercises',
    searchPlaceholder: 'Search exercises',
    a11ySearch: 'Search exercises',
    a11yClearSearch: 'Clear search',
    a11yCard: '{title}, {duration}',
    noResults: 'No exercises match “{query}”.',
    gateItemLabel: 'exercises',
    gateBody: 'Upgrade to Premium to unlock the full exercise library.',
  },
  professionals: {
    title: 'Professionals',
    note: 'Specialists who work with vestibular conditions. Details are a mock directory for now.',
    a11yCard: '{name}, {profession}',
    yearsExperience: '{years} years’ experience',
    waitlistBadge: 'Waitlist',
    gateItemLabel: 'professionals',
    gateBody:
      'Upgrade to Premium to see the rest of the directory and book with any specialist.',
  },
  proDetail: {
    fallbackTitle: 'Professional',
    missing: 'This professional is no longer in the directory.',
    yearsAndCity: '{years} years’ experience · {city}',
    statusAccepting: 'Accepting new patients',
    statusWaitlist: 'Waitlist only',
    sectionAbout: 'About',
    sectionSpecialties: 'Specialties',
    sectionContact: 'Contact',
    a11yCall: 'Call {name}',
    a11yEmail: 'Email {name}',
    clinicLine: '{clinic}, {city}',
    bookCta: 'Request an appointment',
  },
  placeholder: {
    heading: 'To be announced',
    releaseNote: 'A release date has not been announced yet.',
  },
  pending: {
    symptomInsights: 'Symptom tracking and weekly insights will be added later.',
    liv: 'Liv’s AI chat and voice features are not available yet.',
    professionals: 'The professional directory is not available yet. Profiles will be added later.',
    exercises: 'Exercise videos and guided sessions will be added later. No exercises can be completed here yet.',
    meditation: 'Guided meditation and audio sessions will be added later.',
    subscription: 'Subscriptions and payments are not available yet.',
    guidedHelp: 'Guided support is not available yet. This app does not provide emergency assistance.',
    emergencyContact: 'In-app contact calling is not available yet. Use your phone to contact someone directly.',
    emergencyNotice: 'For urgent help, contact your local emergency services directly. This app cannot call for you.',
    diagnosis: 'Diagnostic questions and results are not available yet. You can still record a diagnosis given by your clinician below.',
    socialAuth: 'This sign-in option is not available yet. You can use email instead.',
  },
} as const;
