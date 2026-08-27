import type { NamespaceOf } from '../index';

/**
 * Hebrew for the browse screens. Every value is still the English source string: the keys and
 * their shape are what this file locks down, and a translator fills the values in next.
 *
 * `satisfies` rather than an annotation, so a key that drifts from the English tree fails here
 * instead of quietly falling back at runtime.
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
    heading: 'Not built yet',
  },
} satisfies NamespaceOf<'browse'>;
