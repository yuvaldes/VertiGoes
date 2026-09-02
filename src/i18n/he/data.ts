import type { NamespaceOf } from '../index';

/**
 * The Hebrew data catalogue.
 *
 * The clinical and content caveats on `en/data.ts` apply here with more force: `help.question*`,
 * `diagnosis.*`, `medication.*` and `specialty.*` are left in English on purpose — they are
 * drafts no clinician has reviewed, and translating unreviewed clinical vocabulary carries the
 * same risk as writing it. Everything else in this file is ordinary app/UI copy and has been
 * translated.
 */
export const data = {
  /** The three exercise sessions a day can schedule. */
  slot: {
    morning: 'בוקר',
    midday: 'צהריים',
    evening: 'ערב',
  },

  /** The status card's headline, comparing this week so far against the same span last week. */
  trend: {
    none: 'אין אירועים השבוע - כל הכבוד!',
    improving: 'כמות האירועים השבועית שלכם משתפרת!',
    worse: 'האירועים שלכם עלו מהשבוע שעבר.',
    steady: 'האירועים שלכם יציבים השבוע.',
  },

  sleep: {
    /** Reading a recorded answer back as a sentence. The two ends are open-ended. */
    underSix: 'ישנתם פחות מ-6 שעות',
    ninePlus: 'ישנתם 9+ שעות',
    hoursCount: 'ישנתם {hours} שעות',
    /** The chips themselves. Each one carries its own hour count in the data, not in the text. */
    optionUnderSix: 'פחות מ-6',
    optionSix: '6',
    optionSeven: '7',
    optionEight: '8',
    optionNinePlus: '9+',
  },

  /** Mock conversation summaries, seeded onto past days so the calendar has something to show. */
  livSummary: {
    standing: 'דיברנו על כך שהסחרחורת הופיעה אחרי שקמתם מהר מדי.',
    spinning: 'הזכרתם שהחדר הסתחרר במשך כשלושים שניות הבוקר.',
    sleep: 'עברנו על השינה שלכם וכיצד היא עשויה להשפיע על האירועים.',
    epley: 'שאלתם אם תרגיל אפלי עבד.',
    triggers: 'דיברנו על מה שגרם לסחרחורת ואיך התמודדתם עם זה.',
  },

  /** Labels for the buttons on a card where Liv offers to do something. */
  livAction: {
    startHelp: 'עזרו לי להתמודד',
    completeExercise: 'סמנו כבוצע',
  },

  help: {
    // Clinical drafts — see the file header. Left in English pending a clinician's review.
    questionSpinningNow: 'Is the room spinning right now?',
    questionHeadPosition: 'Did it start when you moved or turned your head?',
    questionCanSit: 'Are you somewhere you can safely sit or lie down?',
    questionWorseThanUsual: 'Is this worse than your usual episode?',
    questionRedFlags: 'Do you have new hearing loss, a severe headache, or trouble speaking?',

    urgentTitle: 'קבלו ייעוץ רפואי עכשיו',
    urgentStepCauses: 'מה שתיארתם עשוי לנבוע מסיבות שדורשות בדיקה פרונטלית אצל רופא.',
    urgentStepCall: 'התקשרו לאיש הקשר לשעת חירום שלכם, או לרופא שלכם, במקום לחכות שזה יעבור.',
    urgentStepEscalate: 'אם התסמינים שלכם חמורים או מחמירים, פנו לטיפול דחוף.',

    calmTitle: 'בואו נרגיע את זה יחד',
    stepSteady: 'התקרבו לקיר או לכיסא וייצבו את עצמכם לפני כל דבר אחר.',
    stepSit: 'שבו או שכבו במקום שבו אתם מרגישים נתמכים.',
    stepFixEyes: 'קבעו את מבטכם על משהו יציב והישארו כך.',
    stepBreathe: 'נשמו לאט - שאיפה לארבע ספירות, נשיפה לשש - עד שהסחרחורת נרגעת.',
    stepMoveSlowly: 'הזיזו את הראש לאט כשאתם קמים שוב.',
    stepMentionDoctor: 'מכיוון שזה גרוע מהרגיל, ציינו זאת לרופא שלכם בביקור הבא.',

    /** One sentence per session, appended to the day's calendar summary. */
    summaryPlain: 'השתמשתם בעזרה באפליקציה.',
    summaryRedFlag: 'השתמשתם בעזרה באפליקציה, ודיווחתם על תסמינים שכדאי לבדוק.',
    summaryPositionalWorse:
      'השתמשתם בעזרה באפליקציה לאירוע שהחל כשהזזתם את הראש, והיה גרוע מהרגיל.',
    summaryPositional: 'השתמשתם בעזרה באפליקציה לאירוע שהחל כשהזזתם את הראש.',
    summaryWorse: 'השתמשתם בעזרה באפליקציה לאירוע גרוע מהרגיל שלכם.',
    summaryEpisode: 'השתמשתם בעזרה באפליקציה במהלך אירוע.',
  },

  /**
   * Exercises and drills store a minute count, not a rendered duration, so this is the only
   * place the unit is written. Hebrew abbreviates minutes differently and may want the numeral
   * on the other side of it.
   */
  duration: {
    minutes: '{minutes} דק׳',
  },

  exercise: {
    armStretches: { title: 'מתיחות זרועות', focus: 'חימום בישיבה' },
    epleyLeft: { title: 'אפלי שמאל', focus: 'מיקום מחדש של גבישונים - אוזן שמאל' },
    epleyRight: { title: 'אפלי ימין', focus: 'מיקום מחדש של גבישונים - אוזן ימין' },
    dixHallpike: { title: 'דיקס-הולפייק', focus: 'הערכה תנוחתית' },
    brandtDaroff: { title: 'ברנדט-דרוף', focus: 'הרגלה, משני הצדדים' },
    semont: { title: 'תמרון סמונט', focus: 'מיקום מחדש מהיר של גבישונים' },
    gazeStabilisation: { title: 'ייצוב מבט', focus: 'בישיבה, תיאום עין-ראש' },
    balanceTraining: { title: 'איזון בעמידה', focus: 'שליטה יציבתית' },
    neckMobility: { title: 'ניידות צוואר', focus: 'חימום בישיבה' },
  },

  drill: {
    boxBreathing: {
      title: 'נשימת קופסה',
      focus: 'מרגיע לב דוהר לפני אירוע',
    },
    breathing478: {
      title: 'נשימת 4-7-8',
      focus: 'מאט את הנשימה כדי להקל על סחרחורת חריפה',
    },
    grounding54321: {
      title: 'הארקה: 5-4-3-2-1',
      focus: 'מעגן את תשומת הלב הרחק מהסחרחורת',
    },
    bodyScan: {
      title: 'סריקת גוף',
      focus: 'משחרר מתח שנבנה במהלך אירוע',
    },
    progressiveRelaxation: {
      title: 'הרפיית שרירים מתקדמת',
      focus: 'עובר על המתח מהראש ועד כף הרגל',
    },
    diaphragmaticBreathing: {
      title: 'נשימה סרעפתית',
      focus: 'בונה נשימת בסיס יציבה יותר',
    },
    sleepWindDown: {
      title: 'הרגעה לפני שינה',
      focus: 'מרגיע את הנפש לפני השינה',
    },
  },

  /** The mock contact's tie to the user. The name and number are data, not copy. */
  emergency: {
    relationship: 'אח',
  },

  gender: {
    female: 'נקבה',
    male: 'זכר',
    other: 'אחר',
  },

  // Clinical drafts — see the file header. Left in English pending a clinician's review.
  diagnosis: {
    bppv: 'BPPV (benign paroxysmal positional vertigo)',
    menieres: 'Ménière’s disease',
    vestibularMigraine: 'Vestibular migraine',
    vestibularNeuritis: 'Vestibular neuritis / labyrinthitis',
    pppd: 'Persistent postural-perceptual dizziness (PPPD)',
    centralVertigo: 'Central vertigo',
  },

  // Clinical drafts — see the file header. Left in English pending a clinician's review.
  /** Same Latin drug names as en/data.ts — the source table keeps them untranslated in Hebrew too. */
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
    hebrew: 'עברית',
    english: 'אנגלית',
    russian: 'רוסית',
    arabic: 'ערבית',
  },

  city: {
    herzliya: 'הרצליה',
    telAviv: 'תל אביב',
    ramatGan: 'רמת גן',
    jerusalem: 'ירושלים',
  },

  // Clinical drafts — see the file header. Left in English pending a clinician's review.
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
      profession: 'רופאת אף אוזן גרון - הפרעות וסטיבולריות',
      clinic: 'מרפאת שיווי המשקל הרצליה',
      about:
        'מתמחה בסחרחורת תנוחתית התקפית שפירה ובמיגרנה וסטיבולרית. מנהלת מרפאה משולבת לאבחון ולשיקום, ומעדיפה לקבל מטופלים תוך שבוע מאירוע חריף.',
    },
    amirCohen: {
      profession: 'פיזיותרפיסט וסטיבולרי',
      clinic: 'מרכז השיקום תל אביב',
      about:
        'עובד בעיקר על תוכניות הרגלה וייצוב מבט, ועל בניית ביטחון מחודש על הרגליים לאחר תקופה ארוכה של אירועים.',
    },
    yaelShani: {
      profession: 'נוירולוגית',
      clinic: 'נוירולוגיה איכילוב',
      about:
        'מקבלת מטופלים שהסחרחורת שלהם כוללת מאפיינים שיש לשלול מבחינה מרכזית - אובדן שמיעה חדש, כאב ראש מתמשך, או סימנים נוירולוגיים לצד הוורטיגו.',
    },
    danielRosen: {
      profession: 'אודיולוג',
      clinic: 'מעבדת שמיעה ושיווי משקל',
      about:
        'מטפל בצד השמיעתי - אודיוגרמות, בדיקות VEMP וקלוריות - ומסביר את התוצאות בשפה פשוטה במקום כהדפסה יבשה.',
    },
    mayaLevi: {
      profession: 'מרפאה בעיסוק',
      clinic: 'קליניקה עצמאית',
      about:
        'מתמקדת בצד המעשי: חזרה לנהיגה, לעבודה ולמדרגות, והתאמת היום סביב האירועים במקום להמתין להם שיחלפו.',
    },
  },

  billing: {
    monthly: 'חודשי',
    annual: 'שנתי',
  },

  /** The same choice as an adverb, for sentences - "Billed annually", not "Billed annual". */
  billingAdverb: {
    monthly: 'חודשית',
    annual: 'שנתית',
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
    card: 'כרטיס אשראי או חיוב',
    apple: 'Apple Pay',
    google: 'Google Pay',
    cardLast4: 'כרטיס ···· {last4}',
    cardShort: 'כרטיס',
  },

  /**
   * The comparison table. `free` and `premium` are resolved with `{ days: FREE_HISTORY_DAYS }`
   * for every row; the rows that have no `{days}` marker simply ignore it.
   */
  plan: {
    log: {
      label: 'יומן תסמינים',
      free: '{days} הימים האחרונים',
      premium: 'היסטוריה מלאה',
    },
    insights: {
      label: 'תובנות',
      free: 'מ-{days} ימי נתונים',
      premium: 'מגמות ודפוסים לטווח ארוך',
    },
    community: {
      label: 'קהילה',
    },
    professionals: {
      label: 'כל אנשי המקצוע',
      free: '3 הראשונים בלבד',
    },
    meditation: {
      label: 'כל תרגילי המדיטציה',
      free: '3 הראשונים בלבד',
    },
    liv: {
      label: 'ליב, הצ׳אט מבוסס הבינה המלאכותית שלכם',
    },
    ads: {
      label: 'ללא פרסומות',
    },
    premiumSummary: 'כל ההיסטוריה שלכם, הקהילה, כל אנשי המקצוע והתרגילים, ליב, וללא פרסומות.',
  },
  tip: {
    rewire: {
      body: 'המוח שלך יודע לתכנת את עצמו מחדש. כל תרגול קצר מלמד אותו מסלולים עצביים עוקפים שמפחיתים את הסחרחורת. מוכנים לעדכן גרסה עם התרגיל הבא?',
    },
    vor: {
      body: 'בתוך הראש שלך פועל מייצב התמונה המהיר בטבע (VOR) שמזיז את העיניים ב־10 אלפיות השנייה. תרגילי מבט מכיילים אותו מחדש כדי שהעולם לא יקפוץ. בואו נכייל אותו לכמה שניות.',
    },
    discomfort: {
      body: 'אי־נוחות קלה בתרגול (רמה 2–3 מתוך 10) היא סימן מצוין. ככה בדיוק המוח מבין שהתנועה בטוחה ומתרגל אליה. עוד צעד קטן והמוח מתרגל!',
    },
    balanceTrio: {
      body: 'שיווי המשקל שלך עובד בצוות של שלושה: אוזניים, עיניים וכפות רגליים. כשאחד מתעייף, התרגול מלמד את השניים האחרים לגבות אותו. מחזקים את הצוות עכשיו.',
    },
    consistency: {
      body: 'שתי דקות תרגול פעמיים־שלוש ביום יעילות למוח הרבה יותר מאימון ארוך פעם בשבוע. הסוד ליציבות הוא עקביות קצרה. דקה אחת – וסימנת וי להיום!',
    },
  },
} satisfies NamespaceOf<'data'>;
