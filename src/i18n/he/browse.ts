import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than a type annotation, so a key that drifts from `en/browse.ts` fails
 * here instead of silently falling back to English at runtime.
 */
export const browse = {
  liv: {
    title: 'ליב',
    voiceReplying: 'ליב עונה…',
    voiceMuted: 'מושתק',
    voiceListening: 'מאזין… (מדומה, לא מוקלט שום קול)',
  },
  menu: {
    title: 'תפריט',
    rowMeditation: 'תרגילי מדיטציה',
    rowExercises: 'תרגילים',
    rowProfessionals: 'אנשי מקצוע',
    rowPlaylists: 'פלייליסטים להקלה',
    playlistsNote: 'פלייליסטים מרגיעים ייפתחו באפליקציית המוזיקה שלכם לאחר חיבור הקישורים.',
    rowCommunity: 'קהילה',
    communityNote: 'הפיד הקהילתי והקבוצות יופיעו כאן.',
    rowPersonalInfo: 'פרטים אישיים',
    rowSymptoms: 'התסמינים שלי',
    symptomsNote: 'התסמינים שדיווחתם עליהם בתהליך ההרשמה יוצגו ויהיו ניתנים לעריכה כאן.',
    rowSubscription: 'מנוי',
    planPremium: 'פרימיום',
    planFree: 'חינם',
    rowLanguage: 'שפה',
    rowSignOut: 'התנתקות',
    languageSheetTitle: 'שפה',
    /**
     * Native only, and about the layout rather than the language: the text changes at once,
     * but the process was laid out left-to-right at launch and cannot turn around mid-session.
     */
    restartNotice: 'השפה נשמרה. סגרו ופתחו מחדש את האפליקציה כדי להחליף את כיוון התצוגה.',
  },
  meditation: {
    title: 'תרגילי מדיטציה',
    a11yCard: '{title}, {duration}',
    gateItemLabel: 'תרגילים',
    gateBody: 'שדרגו לפרימיום כדי לפתוח את כל תרגילי הנשימה וההיאחזות בקרקע.',
  },
  library: {
    title: 'תרגילים',
    searchPlaceholder: 'חיפוש תרגילים',
    a11ySearch: 'חיפוש תרגילים',
    a11yClearSearch: 'נקה חיפוש',
    a11yCard: '{title}, {duration}',
    noResults: 'אין תרגילים התואמים ל-“{query}”.',
    gateItemLabel: 'תרגילים',
    gateBody: 'שדרגו לפרימיום כדי לפתוח את כל ספריית התרגילים.',
  },
  professionals: {
    title: 'אנשי מקצוע',
    note: 'מומחים העובדים עם הפרעות וסטיבולריות. הפרטים הם מדריך מדומה בינתיים.',
    a11yCard: '{name}, {profession}',
    yearsExperience: '{years} שנות ניסיון',
    waitlistBadge: 'רשימת המתנה',
    gateItemLabel: 'אנשי מקצוע',
    gateBody: 'שדרגו לפרימיום כדי לראות את שאר המדריך ולקבוע תור עם כל מומחה.',
  },
  proDetail: {
    fallbackTitle: 'איש מקצוע',
    missing: 'איש מקצוע זה אינו נמצא עוד במדריך.',
    yearsAndCity: '{years} שנות ניסיון · {city}',
    statusAccepting: 'מקבל מטופלים חדשים',
    statusWaitlist: 'רשימת המתנה בלבד',
    sectionAbout: 'אודות',
    sectionSpecialties: 'תחומי התמחות',
    sectionContact: 'יצירת קשר',
    a11yCall: 'התקשרו אל {name}',
    a11yEmail: 'שלחו דוא"ל אל {name}',
    clinicLine: '{clinic}, {city}',
    bookCta: 'בקשת תור',
  },
  placeholder: {
    heading: 'יפורסם בהמשך',
    releaseNote: 'מועד ההשקה עדיין לא פורסם.',
  },
  pending: {
    symptomInsights: 'מעקב אחר תסמינים ותובנות שבועיות יתווספו בהמשך.',
    liv: 'הצ׳אט והשיחה הקולית עם ליב באמצעות בינה מלאכותית עדיין אינם זמינים.',
    professionals: 'מאגר אנשי המקצוע עדיין אינו זמין. פרופילים יתווספו בהמשך.',
    exercises: 'סרטוני תרגול והדרכות יתווספו בהמשך. עדיין לא ניתן להשלים כאן תרגילים.',
    meditation: 'תרגילי מדיטציה מודרכים ותכני שמע יתווספו בהמשך.',
    subscription: 'מנויים ותשלומים עדיין אינם זמינים.',
    guidedHelp: 'הדרכה להתמודדות עדיין אינה זמינה. האפליקציה אינה מספקת סיוע בחירום.',
    emergencyContact: 'חיוג מתוך האפליקציה עדיין אינו זמין. ניתן להתקשר ישירות מהטלפון שלכם.',
    emergencyNotice: 'לעזרה דחופה, פנו ישירות לשירותי החירום המקומיים. האפליקציה אינה יכולה להתקשר עבורכם.',
    diagnosis: 'שאלות אבחון ותוצאות עדיין אינן זמינות. אפשר לשמור למטה אבחנה שקיבלתם מאיש מקצוע.',
    socialAuth: 'אפשרות ההתחברות הזו עדיין אינה זמינה. ניתן להתחבר באמצעות דוא״ל.',
  },
} satisfies NamespaceOf<'browse'>;
