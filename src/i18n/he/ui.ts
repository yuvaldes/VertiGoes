import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than a type annotation, so a key that drifts from `en/ui.ts` fails here
 * instead of silently falling back to English at runtime.
 */
export const ui = {
  premiumGate: {
    a11yUnlock: 'פתחו עוד {count} {itemLabel} עם פרימיום',
    title: 'עוד {count} {itemLabel}',
    cta: 'קבלו פרימיום',
  },
  reorderList: {
    a11yReorder: 'סדרו מחדש את {title}',
    a11yRemove: 'הסירו את {title}',
  },
  /** The three Home tasks, inline on the card and again inside the sheet each one opens. */
  task: {
    completed: 'הושלם',
    notCompleted: 'לא הושלם',
    feelingQuestion: 'איך אתם מרגישים כרגע?',
    feelingAnswered: 'תודה! נשאל אתכם שוב מאוחר יותר',
    a11yFeelingGood: 'מרגיש טוב',
    a11yFeelingBad: 'מרגיש רע',
    sleepQuestion: 'כמה שעות ישנתם?',
    a11yDismissSheet: 'סגרו את {title}',
  },
  weeklyStatus: {
    eyebrow: 'סטטוס',
  },
  headerDate: {
    a11yOpenCalendar: 'פתחו יומן, {label}',
  },
  calendar: {
    a11yChangeYear: 'החליפו שנה, נוכחית {year}',
    a11yDismissYearPicker: 'סגרו את בורר השנים',
    yearPickerTitle: 'קפצו לשנה',
  },
  dayBreakdown: {
    emergencyCall: 'התקשרת לאיש הקשר לשעת חירום',
    episodesOne: 'היה לך {count} אירוע',
    episodesOther: 'היו לך {count} אירועים',
    noEpisodes: 'לא היו לך אירועים',
    inAppHelp: 'קיבלת עזרה באפליקציה',
    a11yOpenDay: '{line}. צפו בכל מה שנרשם ביום זה.',
    livHeading: 'ליב',
    openConversation: 'פתחו שיחה',
    exercisesHeading: 'התרגילים היומיים שלך',
    showExercises: 'הצג תרגילים',
    sleptHours: 'ישנת {hours} שעות',
    /**
     * The same three words as `data.slot.*`. Kept here so the breakdown does not depend on the
     * shape a data module happens to expose; see the note in DayBreakdown.tsx.
     */
    slotMorning: 'בוקר',
    slotMidday: 'צהריים',
    slotEvening: 'ערב',
  },
  /** Keyed by `LivAction['kind']`, so a new action fails to compile until it has a label. */
  livAction: {
    startHelp: 'עזרו לי להתמודד',
    completeExercise: 'סמנו כבוצע',
    dismiss: 'לא עכשיו',
    taken: 'בוצע',
  },
  composer: {
    placeholder: 'כתבו לליב...',
    a11yLabel: 'הודעה לליב',
    a11yDictate: 'הכתיבו הודעה',
    a11ySend: 'שלחו',
    a11yVoiceMode: 'התחילו מצב קולי',
  },
  livAvatar: {
    a11yLabel: 'ליב',
  },
  promptChips: {
    greeting: 'היי {firstName}, אני ליב',
    body: 'ספרו לי איך אתם מרגישים ואני אעקוב אחר זה בשבילכם. כל מה שתגידו כאן יסוכם ביומן שלכם.',
    dizzyNow: 'אני מרגיש סחרחורת ממש עכשיו',
    episodeEarlier: 'היה לי אירוע קודם לכן',
    sleep: 'איך הייתה השינה שלי?',
    exercises: 'תזכירו לי לגבי התרגילים שלי',
  },
  voiceListening: {
    title: 'מאזין…',
    hint: 'מדומה - לא מוקלט שום קול',
    a11yStop: 'הפסיקו להאזין',
  },
  voiceMode: {
    a11yMute: 'השתיקו מיקרופון',
    a11yUnmute: 'בטלו השתקת מיקרופון',
    a11yEnd: 'סיימו מצב קולי',
  },
  /** Simulated speech. These are put into the user's own turn, so they are the user's voice. */
  cannedPhrase: {
    episodeMorning: 'היה לי אירוע סחרחורת הבוקר כשקמתי מהמיטה',
    sleepFiveHours: 'ישנתי רק כחמש שעות הלילה',
    exercisesDizzy: 'סיימתי את התרגילים אבל השני גרם לי לסחרחורת',
    unsteady: 'אני מרגיש קצת לא יציב על הרגליים היום',
  },
} satisfies NamespaceOf<'ui'>;
