import type { NamespaceOf } from '../index';

/**
 * TODO(i18n): not translated yet. Every value below is the English string, held here so a
 * translator has one file with the whole auth surface in it rather than hunting the keys out
 * of the English tree.
 *
 * `satisfies` rather than an annotation: it checks each key against the English tree while
 * keeping the literal types, so a misspelt or misplaced key fails here rather than silently
 * resolving to English at runtime.
 */
export const auth = {
  sheet: {
    title: 'Sign in to VertiGoes',
    google: 'Continue with Google',
    email: 'Continue with email',
    signingIn: 'Signing in…',
    demo: "היכנסו כדי לשמור את ההתקדמות שלכם בין מכשירים.",
  },

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
    consent: 'I agree to the medical and legal disclaimers and the privacy policy.',
    consentIntro: 'כדי להפעיל עבורכם את האפליקציה אנחנו שומרים פרטים אישיים ומידע על הבריאות שלכם במסד הנתונים אצל Supabase. כל שורה נעולה לחשבון שלכם בלבד. איננו מוכרים את המידע ואיננו מעבירים אותו למפרסמים.',
    medicalConsent: 'קראתי והבנתי ש־VertiGoes אינה אבחנה, אינה תחליף לרופא ואינה מיועדת למצבי חירום, ואני משתמש/ת בה מרצוני ועל אחריותי.',
    healthDataConsent: 'אני מסכים/ה מפורשות לכך שמידע על מצב הבריאות שלי, לרבות אבחנה, תסמינים, התקפים ותרגילים, יישמר ויעובד לצורך הפעלת האפליקציה עבורי.',
    consentFootnote: 'שני האישורים נדרשים. אפשר לחזור מההסכמה בכל רגע בכתיבה ל־vertigoesmaya@gmail.com, ואז נמחק את החשבון ואת המידע שבו.',
    linkDisclaimers: 'לקריאת הצהרת הבריאות',
    linkPrivacy: 'לקריאת הצהרת הפרטיות',
    disclaimersTitle: 'Medical and legal disclaimers',
    disclaimersNote:
      'The medical and legal disclaimers have not been written yet. They are not available yet.',
    privacyTitle: 'Privacy policy',
    privacyNote:
      'The privacy policy has not been written yet. It is not available yet.',
    demo: "ייתכן שתצטרכו לאשר את כתובת האימייל לפני הכניסה.",
    confirmation: "בדקו את האימייל ואשרו את החשבון, ואז היכנסו.",
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
    demo: "השתמשו באימייל ובסיסמה של החשבון שלכם.",
    forgot: "שכחתם את הסיסמה?",
    resetSent: "אם קיים חשבון עם הכתובת הזו, נשלח אליו קישור לאיפוס הסיסמה.",
    cta: 'Sign in',
    switchPrompt: 'New here?',
    switchCta: 'Create an account',
  },

  status: {
    syncError: 'לא הצלחנו לשמור או לטעון חלק מהרשומות. נסו שוב לפני סגירת האפליקציה.',
    saving: "שומרים…",
    restoring: "טוענים את החשבון שלכם…",
    retry: "נסו שוב",
  },
  resetPassword: {
    title: "בחירת סיסמה חדשה",
    body: "הזינו סיסמה חדשה לחשבון שלכם.",
    cta: "שמירת סיסמה",
  },

  captcha: {
    label: 'בדיקת אבטחה',
    failed: 'לא הצלחנו לטעון את בדיקת האבטחה. נסו שוב.',
    useWeb: 'השתמשו בגרסת הדפדפן כדי להשלים את בדיקת האבטחה.',
  },
  error: {
    oauthReturn: 'לא הצלחנו להשלים את הכניסה. נסו שוב מאותו דפדפן. אם הבעיה נמשכת, ייתכן שצריך לעדכן את כתובת החזרה מהכניסה.',
    oauthUseWeb: 'כניסה עם Google דורשת את גרסת הדפדפן או גרסת פיתוח מותקנת. פתחו את האפליקציה בדפדפן כדי להיכנס.',
    captcha: 'השלימו את בדיקת האבטחה ונסו שוב.',
    passwordWeak: 'בחרו סיסמה חזקה יותר עם שילוב של אותיות, מספרים וסימנים.',
    emailCooldown: 'המתינו דקה לפני בקשת אימייל נוסף.',
    notConfigured: "הכניסה עדיין אינה זמינה. נסו שוב מאוחר יותר.",
    credentials: "האימייל או הסיסמה אינם נכונים.",
    unconfirmed: "אשרו את כתובת האימייל לפני הכניסה.",
    emailExists: "נסו להיכנס עם האימייל הזה או לאפס את הסיסמה.",
    rateLimit: "יותר מדי ניסיונות. המתינו כמה דקות ונסו שוב.",
    provider: "אפשרות הכניסה הזו אינה זמינה. השתמשו באימייל.",
    connection: "לא הצלחנו להתחבר. בדקו את החיבור ונסו שוב.",
    profileLoad: "לא הצלחנו לטעון את פרטי החשבון. נסו שוב.",
    profileSave: "לא הצלחנו לשמור את השינויים. נסו שוב.",
    profileInvalid: 'חלק מהתשובות אינן תקינות או ארוכות מדי. בדקו את הפרטים ונסו שוב.',
    emailRequired: 'Enter your email address.',
    email: 'Enter an email address like name@example.com.',
    passwordRequired: 'Enter your password.',
    passwordShort: 'Use at least {min} characters.',
    passwordMismatch: 'The two passwords do not match.',
    consent: 'Please agree to the disclaimers to continue.',
    inProgress: 'Already signing in - give it a moment.',
    deleteAccount: 'לא הצלחנו למחוק את החשבון. נסו שוב.',
    exportData: 'לא הצלחנו לייצא את הנתונים. נסו שוב.',
  },

  onboarding: {
    skip: 'Skip',
    a11ySkip: 'Skip for now and finish later from the menu',
    resumeTitle: 'Finish setting up',
    resumeBody: 'A few medical questions tailor your exercises and emergency steps.',
    resumeCta: 'Continue',
    percentComplete: '{percent}%',
  },

  menu: {
    rowSignIn: 'Sign in or create an account',
    guestCardTitle: "You're browsing as a guest",
    guestCardBody: 'Emergency help works either way. Everything else needs an account.',
    guestCardCta: 'Sign in',
    accountLabel: 'Account',
    accountGuest: 'Guest',
    accountGoogle: 'Google account',
    exportData: 'ייצוא הנתונים שלי',
    exporting: 'מכינים את הייצוא…',
  },

  deleteAccount: {
    row: 'מחיקת החשבון',
    title: 'למחוק את החשבון?',
    body: 'הפעולה תמחק לצמיתות את החשבון, התשובות הרפואיות והיסטוריית היומן. לא ניתן לבטל אותה.',
    retention: 'דיווחי תקלות שכבר נשלחו יישמרו ללא זיהוי: הקישור לחשבון ותוכן ההודעה יימחקו, ורק פרטים טכניים כמו פלטפורמה, גרסת אפליקציה, סטטוס ותאריך יישמרו.',
    confirm: 'מחיקה לצמיתות',
    deleting: 'מוחקים…',
  },

  a11y: {
    lockedRow: '{label} - requires an account',
    lockedTab: 'Requires an account. Opens sign in.',
    signingIn: 'Signing in',
    consentCheckbox: 'Agree to the medical and legal disclaimers and the privacy policy',
  },
} satisfies NamespaceOf<'auth'>;
