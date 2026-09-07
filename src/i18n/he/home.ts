import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than a type annotation: it checks every key against the English tree
 * while keeping the literal types, so a misspelt or misplaced key fails here instead of
 * silently falling back to English at runtime.
 */
export const home = {
  exercises: {
    title: 'התרגילים של היום',
  },
  status: {
    greeting: {
      morning: 'בוקר טוב, {firstName}',
      afternoon: 'צהריים טובים, {firstName}',
      evening: 'ערב טוב, {firstName}',
    },
    allDone: 'חיזרו מחר כדי לשמור על הרצף שלכם!',
    tasksWaiting: {
      one: '{count} משימה מחכה לכם היום!',
      other: '{count} משימות מחכות לכם היום!',
    },
    streak: 'רצף של {days} ימים',
    feelingOpen: 'איך אתם מרגישים כרגע?',
    feelingDone: 'תודה! זה עוזר לנו להשתפר',
    sleepOpen: 'כמה שעות ישנתם?',
  },
  calendar: {
    title: 'יומן',
    today: 'היום',
  },
  dayDetail: {
    empty: 'לא נרשם דבר ביום הזה.',
    emergencyTitle: 'התקשרת לאיש הקשר לשעת חירום',
    emergencyContact: '{name} ({relationship}) - {phone}',
    episodes: {
      one: 'היה לך {count} אירוע',
      other: 'היו לך {count} אירועים',
    },
    helpTitle: 'קיבלת עזרה באפליקציה',
    exercisesTitle: 'תרגילים שביצעת',
    sleptHours: 'ישנת {hours} שעות',
    livTitle: 'על מה דיברת עם ליב',
  },
  editExercises: {
    dismissAll: 'הסר הכול',
    libraryLabel: 'כל התרגילים',
    a11yAdd: 'הוסף את {title} להיום',
  },
  exerciseVideos: {
    a11yEdit: 'ערכו תרגילים',
    emptyTitle: 'שום דבר לא מתוזמן להיום',
    emptyBody: 'הוסיפו תרגילים עם העיפרון למעלה.',
    dismissAll: 'הסר הכול להיום',
    a11yCard: '{title}, {duration}, {state}',
    a11yCompleted: 'הושלם',
    a11yNotStarted: 'לא התחיל',
    statusCompleted: 'הושלם',
    statusNotStarted: 'לא התחיל',
  },
} satisfies NamespaceOf<'home'>;
