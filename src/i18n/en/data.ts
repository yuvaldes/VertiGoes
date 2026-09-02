/**
 * Everything the modules in `src/data` used to hold as English literals.
 *
 * The data modules themselves are plain constants with no hooks, so they carry the *keys* and
 * the screens resolve them. That is why this namespace reads like a catalogue rather than like
 * a screen: the shape mirrors `src/data`, not the UI.
 *
 * TODO(clinical): `help.q*`, `diagnosis.*`, `medication.*` and `specialty.*` are drafts that no
 * clinician has reviewed (the same caveat the data modules carry). Translating unreviewed
 * clinical vocabulary carries the same risk as writing it, so a clinician should see both the
 * English and the Hebrew before either reaches a real user.
 *
 * TODO(content): `pro.*` describe an invented directory. If the real directory arrives with its
 * own copy, these keys go with it.
 */
export const data = {
  /** The three exercise sessions a day can schedule. */
  slot: {
    morning: 'Morning',
    midday: 'Mid-day',
    evening: 'Evening',
  },

  /** The status card's headline, comparing this week so far against the same span last week. */
  trend: {
    none: 'No episodes so far this week - keep it up!',
    improving: 'Your weekly episode amount is improving!',
    worse: 'Your episodes are up from last week.',
    steady: 'Your episodes are holding steady this week.',
  },

  sleep: {
    /** Reading a recorded answer back as a sentence. The two ends are open-ended. */
    underSix: 'You slept for less than 6 hours',
    ninePlus: 'You slept for 9+ hours',
    hoursCount: 'You slept for {hours} hours',
    /** The chips themselves. Each one carries its own hour count in the data, not in the text. */
    optionUnderSix: 'Less than 6',
    optionSix: '6',
    optionSeven: '7',
    optionEight: '8',
    optionNinePlus: '9+',
  },

  /** Mock conversation summaries, seeded onto past days so the calendar has something to show. */
  livSummary: {
    standing: 'We talked about how the dizziness came on after standing up too quickly.',
    spinning: 'You mentioned the room spinning for about thirty seconds this morning.',
    sleep: 'We went over your sleep and how it might be affecting the episodes.',
    epley: 'You asked about whether the Epley manoeuvre was working.',
    triggers: 'We talked through what triggered the spinning and how you managed it.',
  },

  /** Labels for the buttons on a card where Liv offers to do something. */
  livAction: {
    startHelp: 'Help me through it',
    completeExercise: 'Mark it done',
  },

  help: {
    questionSpinningNow: 'Is the room spinning right now?',
    questionHeadPosition: 'Did it start when you moved or turned your head?',
    questionCanSit: 'Are you somewhere you can safely sit or lie down?',
    questionWorseThanUsual: 'Is this worse than your usual episode?',
    questionRedFlags: 'Do you have new hearing loss, a severe headache, or trouble speaking?',

    urgentTitle: 'Please get medical advice now',
    urgentStepCauses: 'What you described can have causes that need checking in person.',
    urgentStepCall:
      'Call your emergency contact, or your doctor, rather than waiting this one out.',
    urgentStepEscalate: 'If your symptoms are severe or getting worse, seek urgent care.',

    calmTitle: 'Let’s settle this together',
    stepSteady: 'Get to a wall or a chair and steady yourself before anything else.',
    stepSit: 'Sit or lie down somewhere you feel supported.',
    stepFixEyes: 'Fix your eyes on something still and keep them there.',
    stepBreathe: 'Breathe slowly - in for four, out for six - until the spinning eases.',
    stepMoveSlowly: 'Move your head slowly when you get up again.',
    stepMentionDoctor:
      'Since this is worse than usual, mention it to your doctor at your next visit.',

    /** One sentence per session, appended to the day's calendar summary. */
    summaryPlain: 'You used in-app help.',
    summaryRedFlag: 'You used in-app help, and reported symptoms worth getting checked.',
    summaryPositionalWorse:
      'You used in-app help for an episode that started when you moved your head, and was worse than usual.',
    summaryPositional:
      'You used in-app help for an episode that started when you moved your head.',
    summaryWorse: 'You used in-app help for an episode worse than your usual.',
    summaryEpisode: 'You used in-app help during an episode.',
  },

  /**
   * Exercises and drills store a minute count, not a rendered duration, so this is the only
   * place the unit is written. Hebrew abbreviates minutes differently and may want the numeral
   * on the other side of it.
   */
  duration: {
    minutes: '{minutes} min',
  },

  exercise: {
    armStretches: { title: 'Arm Stretches', focus: 'Seated warm-up' },
    epleyLeft: { title: 'Epley Left', focus: 'Left-ear canalith repositioning' },
    epleyRight: { title: 'Epley Right', focus: 'Right-ear canalith repositioning' },
    dixHallpike: { title: 'Dix Hallpike', focus: 'Positional assessment' },
    brandtDaroff: { title: 'Brandt-Daroff', focus: 'Habituation, both sides' },
    semont: { title: 'Semont Manoeuvre', focus: 'Rapid canalith repositioning' },
    gazeStabilisation: { title: 'Gaze Stabilisation', focus: 'Seated, eye-head coordination' },
    balanceTraining: { title: 'Standing Balance', focus: 'Postural control' },
    neckMobility: { title: 'Neck Mobility', focus: 'Seated warm-up' },
  },

  drill: {
    boxBreathing: {
      title: 'Box Breathing',
      focus: 'Calms a racing heart before an episode',
    },
    breathing478: {
      title: '4-7-8 Breathing',
      focus: 'Slows breathing to ease acute dizziness',
    },
    grounding54321: {
      title: 'Grounding: 5-4-3-2-1',
      focus: 'Anchors attention away from the spinning',
    },
    bodyScan: {
      title: 'Body Scan',
      focus: 'Releases tension that builds during an episode',
    },
    progressiveRelaxation: {
      title: 'Progressive Muscle Relaxation',
      focus: 'Works through tension head to toe',
    },
    diaphragmaticBreathing: {
      title: 'Diaphragmatic Breathing',
      focus: 'Builds a steadier baseline breath',
    },
    sleepWindDown: {
      title: 'Sleep Wind-Down',
      focus: 'Settles the mind before bed',
    },
  },

  /** The mock contact's tie to the user. The name and number are data, not copy. */
  emergency: {
    relationship: 'brother',
  },

  gender: {
    female: 'Female',
    male: 'Male',
    other: 'Other',
  },

  diagnosis: {
    bppv: 'BPPV (benign paroxysmal positional vertigo)',
    menieres: 'Ménière’s disease',
    vestibularMigraine: 'Vestibular migraine',
    vestibularNeuritis: 'Vestibular neuritis / labyrinthitis',
    pppd: 'Persistent postural-perceptual dizziness (PPPD)',
    centralVertigo: 'Central vertigo',
  },

  /** Generic names as given by the source reference table, kept in Latin script in both locales. */
  medication: {
    meclizine: 'Meclizine',
    dimenhydrinate: 'Dimenhydrinate',
    cinnarizineDimenhydrinate: 'Cinnarizine / Dimenhydrinate',
    prochlorperazine: 'Prochlorperazine',
    ondansetron: 'Ondansetron',
    diazepamLorazepam: 'Diazepam / Lorazepam',
    scopolamine: 'Scopolamine',
    betahistine: 'Betahistine',
    hydrochlorothiazideTriamterene: 'Hydrochlorothiazide / Triamterene',
    acetazolamide: 'Acetazolamide',
    dexamethasoneIT: 'Dexamethasone (IT)',
    gentamicinIT: 'Gentamicin (IT)',
    amitriptylineNortriptyline: 'Amitriptyline / Nortriptyline',
    topiramate: 'Topiramate',
    propranololMetoprolol: 'Propranolol / Metoprolol',
    venlafaxine: 'Venlafaxine',
    flunarizineVerapamil: 'Flunarizine / Verapamil',
    cgrpAntagonists: 'CGRP Antagonists',
    sertraline: 'Sertraline',
    escitalopram: 'Escitalopram',
    duloxetine: 'Duloxetine',
    prednisoneMethylprednisolone: 'Prednisone / Methylprednisolone',
  },

  /**
   * Languages a professional speaks, named in the reader's language rather than in themselves —
   * unlike the language *picker*, which uses endonyms (`common.language.*`).
   */
  languageName: {
    hebrew: 'Hebrew',
    english: 'English',
    russian: 'Russian',
    arabic: 'Arabic',
  },

  city: {
    herzliya: 'Herzliya',
    telAviv: 'Tel Aviv',
    ramatGan: 'Ramat Gan',
    jerusalem: 'Jerusalem',
  },

  specialty: {
    bppv: 'BPPV',
    vestibularMigraine: 'Vestibular migraine',
    menieres: 'Ménière’s disease',
    gazeStabilisation: 'Gaze stabilisation',
    balanceRetraining: 'Balance retraining',
    postViralRecovery: 'Post-viral recovery',
    centralVertigo: 'Central vertigo',
    migraine: 'Migraine',
    neuroOtology: 'Neuro-otology',
    audiometry: 'Audiometry',
    vempTesting: 'VEMP testing',
    tinnitus: 'Tinnitus',
    returnToWork: 'Return to work',
    fallPrevention: 'Fall prevention',
    homeAdaptation: 'Home adaptation',
  },

  pro: {
    noaBerger: {
      profession: 'ENT - Vestibular disorders',
      clinic: 'Herzliya Balance Clinic',
      about:
        'Specialises in benign paroxysmal positional vertigo and vestibular migraine. Runs a combined diagnostic and rehab clinic, and prefers to see patients within a week of an acute episode.',
    },
    amirCohen: {
      profession: 'Vestibular physiotherapist',
      clinic: 'Tel Aviv Rehab Centre',
      about:
        'Works mainly on habituation and gaze stabilisation programmes, and on getting people confident on their feet again after a long spell of episodes.',
    },
    yaelShani: {
      profession: 'Neurologist',
      clinic: 'Ichilov Neurology',
      about:
        'Sees patients whose dizziness has features that need ruling out centrally - new hearing loss, persistent headache, or neurological signs alongside the vertigo.',
    },
    danielRosen: {
      profession: 'Audiologist',
      clinic: 'Hearing & Balance Lab',
      about:
        'Handles the hearing side - audiograms, VEMP and caloric testing - and explains the results in plain language rather than a printout.',
    },
    mayaLevi: {
      profession: 'Occupational therapist',
      clinic: 'Independent practice',
      about:
        'Focuses on the practical side: getting back to driving, work and stairs, and adapting the day around episodes rather than waiting them out.',
    },
  },

  billing: {
    monthly: 'Monthly',
    annual: 'Annual',
  },

  /** The same choice as an adverb, for sentences - "Billed annually", not "Billed annual". */
  billingAdverb: {
    monthly: 'monthly',
    annual: 'annually',
  },

  /**
   * Prices are mock USD. The currency sign is inside the string rather than produced by
   * `Intl.NumberFormat` because en-GB renders USD as "US$9.99", which is not what the design
   * shows; keeping it here also lets Hebrew put the sign wherever it belongs.
   */
  price: {
    usd: '${amount}',
  },

  payment: {
    card: 'Credit or debit card',
    apple: 'Apple Pay',
    google: 'Google Pay',
    cardLast4: 'Card ···· {last4}',
    cardShort: 'Card',
  },

  /**
   * The comparison table. `free` and `premium` are resolved with `{ days: FREE_HISTORY_DAYS }`
   * for every row; the rows that have no `{days}` marker simply ignore it.
   */
  plan: {
    log: {
      label: 'Symptoms log',
      free: 'Last {days} days',
      premium: 'Full history',
    },
    insights: {
      label: 'Insights',
      free: 'From {days} days of data',
      premium: 'Long-term trends and patterns',
    },
    community: {
      label: 'Community',
    },
    professionals: {
      label: 'All professionals',
      free: 'First 3 only',
    },
    meditation: {
      label: 'All meditation drills',
      free: 'First 3 only',
    },
    liv: {
      label: 'Liv, your AI chat',
    },
    ads: {
      label: 'No ads',
    },
    premiumSummary:
      'Your whole history, the community, every professional and drill, Liv, and no ads.',
  },
  /**
   * The Home tips strip: five vestibular-science facts, two shown at a time (see
   * `src/data/tips.ts`). Each is one card's body text — the emoji and the "Did you know" hook
   * live in the card itself, not here, so this is the fact alone plus its own call to action.
   */
  tip: {
    rewire: {
      body: 'Your brain is built to rewire itself. Every short exercise teaches it new neural pathways to bypass dizziness. Ready for a quick system upgrade?',
    },
    vor: {
      body: 'You have the fastest image stabilizer in nature (VOR), moving your eyes in under 10 milliseconds. Gaze exercises recalibrate it so your vision stays steady. Let’s calibrate it for a few seconds.',
    },
    discomfort: {
      body: 'Mild discomfort during practice (level 2–3 out of 10) is a great sign. It is exactly how your brain learns movement is safe and adapts to it. One small step to build tolerance!',
    },
    balanceTrio: {
      body: 'Your balance relies on a trio: inner ears, eyes, and feet. When one struggles, vestibular exercises train the other two to step up and keep you steady. Let’s back up the team.',
    },
    consistency: {
      body: 'Practicing for 2 minutes a few times a day is far more effective for the brain than one long weekly session. Consistency is the real key to stability. Just one minute to check today’s goal.',
    },
  },
} as const;
