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
  menuRow: {
    a11yPremium: '{label} - דורש פרימיום',
    a11yWithValue: '{label}, {value}',
  },
} satisfies NamespaceOf<'common'>;
