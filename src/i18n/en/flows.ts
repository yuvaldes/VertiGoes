/**
 * The multi-step flows: onboarding, in-app help, pricing and checkout — plus the two
 * placeholder notes the shell writes when it pushes a screen that has no player yet.
 *
 * These screens are the app's only *sequences*, so their copy is grouped by step rather than
 * by screen file: `basicInfo`, `medicalHistory` and the rest are the wizard's pages, and each
 * one is a single translation unit even though the shell that renders them lives elsewhere.
 */
export const flows = {
  /** The wizard chrome that wraps every onboarding step. */
  onboarding: {
    finish: 'Finish',
    continue: 'Continue',
  },

  basicInfo: {
    title: 'Basic info',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Dafna',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Levi',
    ageLabel: 'Age (18 or older)',
    agePlaceholder: '34',
    ageUnder18: 'You must be at least 18 years old to use VertiGoes.',
    genderLabel: 'Gender',
    languageLabel: 'Language',
  },

  medicalHistory: {
    title: 'Medical history',
    diagnosedQuestion: 'Have you been diagnosed before?',
    diagnosedHint: 'This will help personalize your experience.',
    /** The two escape hatches appended to the clinical lists in `data/onboarding`. */
    diagnosisOther: 'I have another that was not listed',
    diagnosisNone: 'None of the above',
    otherDiagnosisLabel: 'What were you diagnosed with?',
    otherDiagnosisPlaceholder: 'Describe it in your own words',
    notDiagnosedInfo:
      'Diagnostic questions and results are to be announced. You can continue without a diagnosis.',
    medicationQuestion: 'Do you take any medication related to vertigo?',
    medicationOther: 'Something else',
    medicationNone: 'None',
    otherMedicationLabel: 'Which medication?',
    otherMedicationPlaceholder: 'Name and dose, if you know it',
  },

  diagnosis: {
    title: 'Diagnosis',
    hint: 'Not required - you can do this later at any time.',
    emptyTitle: 'No questions yet',
    emptyBody:
      "This screen is ready for a set of yes/no diagnostic questions - there just isn't one loaded yet. If you already know your diagnosis, enter it below instead.",
    manualLabel: 'Already know your diagnosis?',
    manualPlaceholder: 'Enter it here',
  },

  emergencyContact: {
    title: 'Emergency contact',
    hint: 'You can save a contact here. Calling from the app is to be announced.',
    nameLabel: 'Full name',
    namePlaceholder: 'George Levi',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+1 555 0142',
  },

  help: {
    title: 'Help me through it',
    /**
     * No longer shown: the design gives the question the whole screen. Kept for the screen
     * reader, which otherwise loses all sense of how far into the flow it is. No fixed total
     * any more — the tree branches, so how many questions are left depends on the answers
     * already given.
     */
    progress: 'Question {step}',
    callContact: 'Call {name} ({relationship})',
    done: 'I’m done',
    recorded: 'Saved to today in your calendar.',
    about: {
      title: 'About this condition',
      whatIsLabel: 'What it is',
      symptomsLabel: 'Symptoms',
      treatmentLabel: 'Treatment',
    },
  },

  subscription: {
    title: 'Subscription',

    a11yAnnual: 'Annual billing, save {percent} percent',
    a11yMonthly: 'Monthly billing',
    saveBadge: '−{percent}%',

    activeTitle: 'Premium is active',
    trialUntil: "Your free trial runs until {date}. We'll remind you two days before it ends.",
    thanks: 'Thanks for subscribing.',
    /** Appended to whichever of the two above applies, with a space between. */
    billedAdverb: 'Billed {period}.',

    rowPaymentMethod: 'Payment method',
    paymentNone: 'None',
    rowCancel: 'Cancel subscription',

    planName: 'Premium',
    trialPill: '{days}-day free trial',
    perMonth: '/mo',
    priceNoteAnnual: 'Billed {price} once a year - {percent}% less than monthly.',
    priceNoteMonthly: 'Switch to annual to save {percent}%.',
    a11yCta: 'Start your {days} day free trial, then {price} {period}',
    cta: 'Start {days}-day free trial',
    reminder:
      "We'll remind you two days before the trial ends, so you can stop before you're charged.",

    compareTitle: "What's included",
    columnFeatures: 'Features',
    columnFree: 'Free',
    columnPremium: 'Premium',

    cancelTitle: 'Cancel Premium?',
    cancelInTrial: "You're still in the free trial, so you won't be charged anything.",
    cancelNotInTrial: 'You will not be charged again.',
    /** Appended to whichever of the two above applies, with a space between. */
    cancelHistoryNote:
      "Your log stays put, but you'll only be able to see the last {days} days of it again.",
    cancelKeep: 'Keep Premium',
    cancelConfirm: 'Cancel it',
  },

  checkout: {
    unavailableTitle: 'Payments are not available yet',
    unavailableBody: 'Checkout is not connected to a payment provider. Please do not enter payment details.',
    titleSubscribe: 'Checkout',
    titleUpdate: 'Payment method',

    summaryPlan: 'Premium, billed {period}',
    perYear: '/yr',
    perMonth: '/mo',
    dueToday: 'Due today',
    dueTodayAmount: '$0.00',
    summaryNote: "Your {days}-day trial starts now. We'll remind you two days before it ends.",
    updateNote:
      "This replaces the card or wallet your subscription is billed to. Your plan and renewal date don't change.",

    sectionPayWith: 'Pay with',
    a11yMethod: '{label}. {detail}',
    methodCardDetail: 'Visa, Mastercard, Amex',
    methodAppleDetail: 'Confirm with Face ID',
    methodGoogleDetail: 'Confirm in the Google Pay sheet',

    cardNumberLabel: 'Card number',
    cardNumberPlaceholder: '4242 4242 4242 4242',
    expiryLabel: 'Expiry',
    expiryPlaceholder: 'MM/YY',
    cvcLabel: 'CVC',
    cvcPlaceholder: '123',
    nameLabel: 'Name on card',
    namePlaceholder: 'Dafna Levi',

    walletNote:
      '{wallet} will ask you to confirm. Your card details stay with {wallet} - VertiGoes never sees them.',

    a11ySave: 'Save payment method',
    a11yTrial: 'Start free trial, {price} {period} after {days} days',
    ctaSave: 'Save payment method',
    ctaWallet: 'Pay with {wallet}',
    ctaTrial: 'Start {days}-day free trial',
    legal: "Demo - nothing is submitted and no card is charged. Don't enter a real card number.",
  },

  /** Written by `AppShell` when it pushes a screen whose real content does not exist yet. */
  shell: {
    drillPlaceholderNote: 'The guided audio for {title} ({duration}) will live here.',
    exercisePlaceholderNote: 'The guided player for {title} ({duration}) will live here.',
  },
} as const;
