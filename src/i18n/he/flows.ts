import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than an annotation: it checks each key against the English tree while
 * keeping the literal types, so a misspelt or misplaced key fails here rather than silently
 * resolving to English at runtime.
 */
export const flows = {
  /** The wizard chrome that wraps every onboarding step. */
  onboarding: {
    finish: 'סיום',
    continue: 'המשך',
  },

  basicInfo: {
    title: 'פרטים בסיסיים',
    firstNameLabel: 'שם פרטי',
    firstNamePlaceholder: 'דפנה',
    lastNameLabel: 'שם משפחה',
    lastNamePlaceholder: 'לוי',
    ageLabel: 'גיל',
    agePlaceholder: '34',
    genderLabel: 'מגדר',
    languageLabel: 'שפה',
  },

  medicalHistory: {
    title: 'היסטוריה רפואית',
    diagnosedQuestion: 'האם אובחנתם בעבר?',
    diagnosedHint: 'זה יעזור להתאים אישית את החוויה שלכם.',
    diagnosisOther: 'יש לי אבחנה אחרת שלא מופיעה ברשימה',
    diagnosisNone: 'אף אחת מהאפשרויות',
    otherDiagnosisLabel: 'במה אובחנתם?',
    otherDiagnosisPlaceholder: 'תארו זאת במילים שלכם',
    notDiagnosedInfo:
      'שאלות אבחון ותוצאות יפורסמו בהמשך. ניתן להמשיך ללא אבחנה.',
    medicationQuestion: 'האם אתם נוטלים תרופות הקשורות לסחרחורת?',
    medicationOther: 'משהו אחר',
    medicationNone: 'ללא',
    otherMedicationLabel: 'איזו תרופה?',
    otherMedicationPlaceholder: 'שם ומינון, אם ידוע לכם',
  },

  diagnosis: {
    title: 'אבחנה',
    hint: 'לא חובה - תוכלו לעשות זאת מאוחר יותר בכל עת.',
    emptyTitle: 'אין עדיין שאלות',
    emptyBody:
      'המסך הזה מוכן לסדרת שאלות אבחון כן/לא - פשוט עוד לא נטענה כזו. אם אתם כבר יודעים מה האבחנה שלכם, הזינו אותה למטה במקום זאת.',
    manualLabel: 'כבר יודעים מה האבחנה שלכם?',
    manualPlaceholder: 'הזינו אותה כאן',
  },

  emergencyContact: {
    title: 'איש קשר לשעת חירום',
    hint: 'אפשר לשמור כאן איש קשר. אפשרות החיוג מהאפליקציה תתווסף בהמשך.',
    nameLabel: 'שם מלא',
    namePlaceholder: 'ג׳ורג׳ לוי',
    phoneLabel: 'מספר טלפון',
    phonePlaceholder: '+1 555 0142',
  },

  help: {
    title: 'עזרו לי להתמודד',
    progress: 'שאלה {step}',
    callContact: 'התקשרו אל {name} ({relationship})',
    done: 'סיימתי',
    recorded: 'נשמר להיום ביומן שלכם.',
    about: {
      title: 'על המצב הזה',
      whatIsLabel: 'מה זה',
      symptomsLabel: 'תסמינים',
      treatmentLabel: 'טיפול',
    },
  },

  subscription: {
    title: 'מנוי',

    a11yAnnual: 'חיוב שנתי, חסכו {percent} אחוזים',
    a11yMonthly: 'חיוב חודשי',
    saveBadge: '−{percent}%',

    activeTitle: 'פרימיום פעיל',
    trialUntil: 'תקופת הניסיון החינמית שלכם נמשכת עד {date}. נזכיר לכם יומיים לפני שהיא מסתיימת.',
    thanks: 'תודה על ההרשמה.',
    /** Appended to whichever of the two above applies, with a space between. */
    billedAdverb: 'החיוב מתבצע {period}.',

    rowPaymentMethod: 'אמצעי תשלום',
    paymentNone: 'ללא',
    rowCancel: 'ביטול המנוי',

    planName: 'פרימיום',
    trialPill: '{days} ימי ניסיון חינם',
    perMonth: '/לחודש',
    priceNoteAnnual: 'חיוב של {price} פעם בשנה - {percent}% פחות מאשר תשלום חודשי.',
    priceNoteMonthly: 'עברו לתשלום שנתי כדי לחסוך {percent}%.',
    a11yCta: 'התחילו את תקופת הניסיון בת {days} הימים, ולאחר מכן {price} {period}',
    cta: 'התחילו {days} ימי ניסיון חינם',
    reminder: 'נזכיר לכם יומיים לפני שתקופת הניסיון מסתיימת, כדי שתוכלו לבטל לפני שתחויבו.',

    compareTitle: 'מה כלול',
    columnFeatures: 'תכונות',
    columnFree: 'חינם',
    columnPremium: 'פרימיום',

    cancelTitle: 'לבטל את הפרימיום?',
    cancelInTrial: 'אתם עדיין בתקופת הניסיון החינמית, כך שלא תחויבו בכלום.',
    cancelNotInTrial: 'לא תחויבו שוב.',
    /** Appended to whichever of the two above applies, with a space between. */
    cancelHistoryNote: 'ההיסטוריה שלכם נשארת, אבל תוכלו לראות שוב רק את {days} הימים האחרונים בה.',
    cancelKeep: 'השאירו פרימיום',
    cancelConfirm: 'בטלו אותו',
  },

  checkout: {
    unavailableTitle: 'תשלומים עדיין אינם זמינים',
    unavailableBody: 'התשלום עדיין אינו מחובר לספק סליקה. אין להזין פרטי תשלום.',
    titleSubscribe: 'תשלום',
    titleUpdate: 'אמצעי תשלום',

    summaryPlan: 'פרימיום, חיוב {period}',
    perYear: '/לשנה',
    perMonth: '/לחודש',
    dueToday: 'לתשלום היום',
    dueTodayAmount: '$0.00',
    summaryNote: 'תקופת הניסיון בת {days} הימים שלכם מתחילה עכשיו. נזכיר לכם יומיים לפני שהיא מסתיימת.',
    updateNote:
      'זה מחליף את הכרטיס או הארנק שהמנוי שלכם מחויב אליו. התוכנית ותאריך החידוש שלכם לא משתנים.',

    sectionPayWith: 'שלמו באמצעות',
    a11yMethod: '{label}. {detail}',
    methodCardDetail: 'ויזה, מאסטרקארד, אמקס',
    methodAppleDetail: 'אשרו עם Face ID',
    methodGoogleDetail: 'אשרו בחלונית Google Pay',

    cardNumberLabel: 'מספר כרטיס',
    cardNumberPlaceholder: '4242 4242 4242 4242',
    expiryLabel: 'תוקף',
    expiryPlaceholder: 'MM/YY',
    cvcLabel: 'CVC',
    cvcPlaceholder: '123',
    nameLabel: 'שם על הכרטיס',
    namePlaceholder: 'דפנה לוי',

    walletNote:
      '{wallet} יבקש מכם לאשר. פרטי הכרטיס שלכם נשארים אצל {wallet} - VertiGoes אף פעם לא רואה אותם.',

    a11ySave: 'שמרו אמצעי תשלום',
    a11yTrial: 'התחילו ניסיון חינם, {price} {period} לאחר {days} ימים',
    ctaSave: 'שמרו אמצעי תשלום',
    ctaWallet: 'שלמו עם {wallet}',
    ctaTrial: 'התחילו {days} ימי ניסיון חינם',
    legal: 'הדגמה - שום דבר לא נשלח ואף כרטיס לא מחויב. אל תזינו מספר כרטיס אמיתי.',
  },

  /** Written by `AppShell` when it pushes a screen whose real content does not exist yet. */
  shell: {
    drillPlaceholderNote: 'הנגן המודרך עבור {title} ({duration}) יופיע כאן.',
    exercisePlaceholderNote: 'הנגן המודרך עבור {title} ({duration}) יופיע כאן.',
  },
} satisfies NamespaceOf<'flows'>;
