import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than a type annotation: it checks every key against the English tree
 * while keeping the literal types, so a misspelt or misplaced key fails here instead of
 * silently falling back to English at runtime.
 *
 * The endonyms in `language` are deliberately English/Hebrew regardless of locale — see the
 * note in en/common.ts.
 */
export const common = {
  action: {
    back: 'חזרה',
    close: 'סגירה',
    done: 'סיום',
    dismiss: 'סגור',
  },
  answer: {
    yes: 'כן',
    no: 'לא',
  },
  // Endonyms are the same in every locale. See the note in en/common.ts.
  language: {
    en: 'English',
    he: 'עברית',
  },
  header: {
    greeting: 'שלום, {firstName}',
    taskCountOne: '{count} משימה',
    taskCountOther: '{count} משימות',
    tasksWaitingOne: 'מחכה לך היום',
    tasksWaitingOther: 'מחכות לך היום',
  },
  bottomBar: {
    emergency: 'חירום',
    a11yOpenEmergency: 'פתחו אפשרויות חירום',
    tabHome: 'בית',
    tabLiv: 'ליב',
    tabMenu: 'תפריט',
  },
  emergency: {
    title: 'חירום',
    callTitle: 'התקשרו לאיש קשר לשעת חירום',
    callSubtitle: '{name} ({relationship})',
    helpTitle: 'עזרו לי להתמודד',
    helpSubtitle: 'קבלו עזרה מיידית באפליקציה',
    a11yDismiss: 'סגרו אפשרויות חירום',
  },
  exercises: {
    title: 'התרגילים של היום',
    a11yEdit: 'ערכו תרגילים',
    allDoneTitle: 'כל התרגילים הושלמו!',
    allDoneSubtitle: 'חיזרו מאוחר יותר כדי לחזור עליהם.',
    statusCompleted: 'הושלם',
    statusStart: 'התחילו',
  },
  insight: {
    openCalendar: 'פתחו יומן',
  },
  menuRow: {
    a11yPremium: '{label} - דורש פרימיום',
    a11yWithValue: '{label}, {value}',
  },
} satisfies NamespaceOf<'common'>;
