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

  /**
   * The in-app triage tree — sourced from the clinician-supplied "VertiGoes Self-Triage
   * Decision Tree (Mode B)" document. Node ids (Q0.1, Q2A, DX-BPPV, ER, ...) match the
   * document's own Node IDs so the two can be cross-referenced. See `src/data/helpFlow.ts`
   * for how these compose into the graph.
   */
  help: {
    /** Q0 — the safety gate. A "yes" to any one of these routes straight to `ER`. */
    q0: {
      headache: 'Sudden, severe headache unlike any I’ve had before',
      weakness: 'New weakness or numbness on one side of the body (face, arm, or leg)',
      speech: 'Sudden difficulty speaking or slurred speech',
      doubleVision: 'Sudden double vision',
      swallowing: 'New difficulty swallowing',
      imbalance: 'Severe imbalance — unable to walk or stand at all without help',
      chestPain: 'Chest pain or strong, unusual heart palpitations',
      headInjury: 'Head or neck injury preceded symptom onset',
      consciousness: 'Loss of consciousness or fainting',
    },

    q1: {
      text: 'How did the dizziness start?',
      sudden: 'Suddenly (seconds to minutes)',
      gradual: 'Gradually (hours to days)',
      chronic: 'Chronic — weeks or more, comes and goes or constant',
    },

    q2a: {
      text: 'What is the pattern of the episode?',
      positional: 'Seconds, positional (rolling, looking up, lying down)',
      recurring: 'Minutes to hours, recurring',
      continuous: 'Hours to days, continuously ongoing now',
    },

    q3bppv: {
      text: 'Is it triggered by rolling over in bed, looking up, or lying down/sitting up?',
    },

    q4ear: {
      text: 'In which head position or direction are symptoms strongest? (This helps identify the affected ear.)',
      right: 'Right',
      left: 'Left',
      bilateral: 'Bilateral',
      unclear: 'Unclear',
    },

    q3epi: {
      text: 'Hearing loss, tinnitus (ringing), or ear fullness during the episode?',
      yesFluctuating: 'Yes, fluctuating in intensity between episodes',
    },

    q5mig: {
      text: 'Headache, light/sound sensitivity, or a personal/family migraine history?',
      noVascular:
        'No, but vascular risk factors are present (age 55+, hypertension, diabetes, smoking, AFib)',
      noPlain: 'No, and no notable risk factors',
    },

    q3cont: {
      text: 'Hearing loss, tinnitus, fever, or signs of infection?',
    },

    q4cent: {
      text: 'One more check: can you walk unassisted? Is the direction of any eye-jumping constant? No double vision or weakness?',
      abnormal: 'One or more of these is not right',
      normal: 'All of these are fine',
    },

    q2b: {
      text: 'Did you start a new medication recently, or did this begin close to a period of significant stress or anxiety?',
      newMed: 'New medication',
      stress: 'Started along with stress or anxiety',
      neither: 'Neither of those',
    },

    q2c: {
      text: 'What best describes the chronic dizziness?',
      rocking:
        'A rocking or swaying feeling, worse standing, worse in busy visual places (stores, malls)',
      lightheaded: 'Lightheaded on standing up, not spinning',
      neck: 'Worse with neck movement or neck pain',
      unsteady: 'Unsteadiness only (not spinning), worse in the dark or on uneven ground',
    },

    q3ortho: {
      text: 'Does the dizziness come with palpitations, chest pain, or feeling faint?',
    },

    /** Outcome copy. `noteKeys` in helpFlow.ts point pieces of this into the guidance list. */
    outcome: {
      bppv: {
        title: 'BPPV suspected (Benign Paroxysmal Positional Vertigo)',
        note: 'This points to the Dix-Hallpike test for diagnosis and the Epley or Semont maneuver for treatment, with vestibular physical therapy if needed.',
        noteContraindications:
          'Check for contraindications — neck or back issues, recent eye surgery — before trying any maneuver.',
        about: {
          whatIs:
            'The most common cause of vertigo (~20% of all cases). Tiny calcium crystals (otoconia) dislodge and drift into the inner ear’s semicircular canals.',
          symptoms:
            'Intense, brief spinning sensations (lasting seconds) triggered by head position changes (turning in bed, looking up, or bending over).',
          treatment:
            'Repositioning maneuvers (Epley, Semont, or BBQ roll maneuvers) with an over 90% success rate.',
        },
      },
      bppvUnclear: {
        title: 'BPPV suspected (Benign Paroxysmal Positional Vertigo)',
        note: 'Because the affected side isn’t clear, a physiotherapist should assess you before trying any repositioning maneuver on your own — the wrong direction can make symptoms worse.',
      },
      meniere: {
        title: 'Ménière’s disease suspected',
        note: 'See an ENT specialist for evaluation and a hearing test (audiogram). Positional release maneuvers are not appropriate here.',
        about: {
          whatIs: 'Fluid accumulation (endolymphatic hydrops) within the inner ear chambers.',
          symptoms:
            'Episodic vertigo attacks (lasting 20 minutes to 12 hours), fluctuating low-frequency hearing loss, tinnitus, and ear fullness.',
          treatment:
            'Low-sodium diet, diuretics, targeted medical therapies, and vestibular rehabilitation between attacks.',
        },
      },
      vm: {
        title: 'Vestibular migraine suspected',
        note: 'Recommend a medical evaluation (neurologist or GP) and keeping a trigger diary.',
        about: {
          whatIs:
            'The second most common cause of episodic vertigo, frequently underdiagnosed. Linked to the brain’s migraine pathways, often occurring without an actual headache.',
          symptoms:
            'Episodes of vertigo or unsteadiness (lasting minutes to days), sensitivity to light, sound, or visual motion.',
          treatment:
            'Lifestyle modifications, migraine preventive medications, and customized vestibular rehabilitation.',
        },
      },
      tia: {
        title: '⚠️ Possible TIA (transient ischemic attack)',
        note: 'This doesn’t meet the criteria for an emergency, but given your risk factors it’s important to get urgent medical care today rather than wait.',
      },
      paroxysmia: {
        title: 'Vestibular paroxysmia possible',
        note: 'This is relatively rare — a neurological evaluation is recommended.',
      },
      labyrinthitis: {
        title: 'Labyrinthitis suspected',
        note: 'Get an urgent referral to a physician or ENT — you may need antibiotic or steroid treatment.',
        about: {
          whatIs:
            'Inflammation of the inner ear labyrinth, affecting both balance and hearing structures simultaneously.',
          symptoms:
            'Sudden severe spinning vertigo accompanied by acute hearing loss and/or tinnitus.',
          treatment:
            'Urgent medical management (steroids or antibiotics based on etiology) and subsequent vestibular rehabilitation.',
        },
      },
      neuritis: {
        title: 'Vestibular neuritis suspected',
        note: 'See a physician and consider vestibular physical therapy for rehabilitation.',
        noteFollowUp: 'Follow up if symptoms don’t improve within a few days.',
        about: {
          whatIs:
            'Inflammation (usually viral) of the vestibular nerve, which carries balance signals from the inner ear to the brain.',
          symptoms:
            'Sudden onset of severe spinning vertigo, nausea, and unsteadiness lasting several days, with no hearing loss.',
          treatment:
            'Short-term medication for acute symptoms, followed by vestibular rehabilitation therapy (VRT) to drive neural compensation.',
        },
      },
      ototoxicity: {
        title: 'Ototoxicity possible',
        note: 'Check with the doctor who prescribed the medication — don’t stop it on your own.',
      },
      anxiety: {
        title: 'Anxiety-related dizziness possible',
        note: 'Recommend a medical evaluation, and consider mental-health support alongside a vestibular work-up.',
      },
      pppd: {
        title: 'PPPD suspected (Persistent Postural-Perceptual Dizziness)',
        note: 'This often develops after an acute vestibular event, migraine, or anxiety. See a physician and consider tailored vestibular physical therapy (graded habituation), possibly alongside CBT-informed support.',
        about: {
          whatIs:
            'A chronic functional vestibular disorder where the brain remains in high-alert mode following an initial balance trigger.',
          symptoms:
            'Persistent non-spinning dizziness, rocking, or unsteadiness (3+ months), exacerbated by upright posture, motion, and visually complex environments (malls, screens, scrolling).',
          treatment:
            'Tailored vestibular rehabilitation (habituation), Cognitive Behavioral Therapy (CBT), and SSRI/SNRI medications.',
        },
      },
      oh: {
        title: 'Orthostatic hypotension possible',
        note: 'See a physician for a lying/standing blood-pressure check and a review of your medications.',
      },
      cervicogenic: {
        title: 'Cervicogenic dizziness possible',
        note: 'See a physiotherapist with a combined neck-and-vestibular focus.',
        about: {
          whatIs:
            'Balance dysfunction resulting from faulty sensory input (proprioception) from the muscles and joints of the cervical spine.',
          symptoms:
            'Dizziness, unsteadiness, or lightheadedness closely tied to neck pain, stiffness, or restricted cervical motion.',
          treatment:
            'Manual cervical physical therapy, strengthening exercises, postural training, and sensorimotor eye-neck coordination.',
        },
      },
      bilateral: {
        title: 'Bilateral vestibulopathy possible',
        note: 'Think about any history of ototoxic medications (like aminoglycosides), and get a VNG test or physician evaluation.',
        about: {
          whatIs: 'Partial or complete loss of vestibular function in both inner ears simultaneously.',
          symptoms:
            'Bouncing or blurry vision during head movement/walking (oscillopsia) and significant unsteadiness, especially in the dark or on uneven terrain.',
          treatment:
            'Advanced vestibular rehabilitation focusing on sensory substitution (vision and proprioception) and fall-prevention strategies.',
        },
      },
      unknown: {
        title: 'Not a clear pattern',
        note: 'What you described didn’t point clearly to one thing — it’s worth getting checked by a doctor.',
      },
    },

    /**
     * Reference detail for two diagnoses the triage tree doesn't reach yet — no existing
     * question routes to them, and adding that routing is a clinical decision for whoever
     * maintains the source decision-tree doc, not something to guess at here. Kept so the
     * copy is ready the moment the tree grows a path to either one; see helpFlow.ts.
     */
    futureOutcomes: {
      mdds: {
        title: 'Mal de Débarquement Syndrome (MdDS)',
        whatIs:
          'A persistent phantom motion sensation occurring when the brain fails to readapt after passive motion exposure (such as cruises, flights, or train rides).',
        symptoms:
          'Constant rocking, swaying, or bobbing feeling that characteristically temporarily improves during passive motion (e.g., driving in a car).',
        treatment:
          'Optokinetic stimulation protocols (OKN), specialized vestibular therapy, and sensory recalibration.',
      },
      sscd: {
        title: 'Superior Semicircular Canal Dehiscence (SSCD)',
        whatIs:
          'A small bony opening (dehiscence) in the temporal bone covering the superior semicircular canal.',
        symptoms:
          'Vertigo triggered by loud noises (Tullio phenomenon) or pressure changes (coughing, straining), alongside amplified hearing of internal body sounds (autophony).',
        treatment:
          'High-resolution temporal bone CT for diagnosis; management ranges from conservative triggers avoidance to surgical repair.',
      },
    },

    /** `ER`, the emergency outcome — from the safety gate, or from Q4-CENT/Q3-ORTHO. */
    urgentTitle: '🚨 Emergency — please seek help now',
    urgentStepCauses: 'What you described needs to be checked in person, right away.',
    urgentStepCall: 'Go to the emergency room, or call emergency services (101 in Israel), now.',
    urgentStepEscalate:
      'If you have someone with you, ask them to go with you or to call on your behalf.',

    /** One sentence per session, appended to the day's calendar summary. */
    summaryPlain: 'You used in-app help.',
    summaryEmergency: 'You used in-app help and were directed to seek emergency care.',
    summaryPrefix: 'You used in-app help; Liv’s triage suggested:',
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
  /**
   * Two rendered lines is the whole budget — the card clamps at two and truncates past it, so
   * each of these is kept under ~92 characters, measured against Inter 12 in the card's column.
   *
   * They also carry no call to action, unlike the first draft of them: the card is purely
   * informational and has nowhere to send a tap, so "ready for a quick system upgrade?" was
   * inviting a press that does nothing.
   */
  tip: {
    rewire: {
      body: 'Your brain can adapt. Short, repeated exercises retrain how it handles dizziness.',
    },
    vor: {
      body: 'Your eye-stabilising reflex (VOR) reacts in about 10 milliseconds — among the body’s fastest.',
    },
    discomfort: {
      body: 'Mild discomfort while you practise (level 2–3 of 10) is normal; ease off if it climbs.',
    },
    balanceTrio: {
      body: 'Balance blends three signals: your inner ears, your eyes, and the feel of the ground.',
    },
    consistency: {
      body: 'Short practice spread through the day works better than one long weekly session.',
    },
  },
} as const;
