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
  calendar: {
    title: 'יומן',
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
} satisfies NamespaceOf<'home'>;
