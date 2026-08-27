import type { NamespaceOf } from '../index';

/**
 * `satisfies` rather than a type annotation: it checks every key against the English tree
 * while keeping the literal types, so a misspelt or misplaced key fails here instead of
 * silently falling back to English at runtime.
 *
 * Anything below still holding English is a scaffold for the translation pass, not a
 * decision — the endonyms in `language` are the one exception, and they stay English by
 * design. Search this file for Latin text to find what is still outstanding.
 */
export const common = {
  action: {
    back: 'חזרה',
    close: 'סגירה',
    done: 'סיום',
    dismiss: 'Dismiss',
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
    taskCountOne: '{count} task',
    taskCountOther: '{count} tasks',
    tasksWaitingOne: 'is waiting for you today',
    tasksWaitingOther: 'are waiting for you today',
  },
  brandRow: {
    a11ySwitchLayout: 'Switch home layout',
  },
  bottomBar: {
    emergency: 'Emergency',
    a11yOpenEmergency: 'Open emergency options',
    tabHome: 'Home',
    tabLiv: 'Liv',
    tabMenu: 'Menu',
  },
  emergency: {
    title: 'Emergency',
    callTitle: 'Call emergency contact',
    callSubtitle: '{name} ({relationship})',
    helpTitle: 'Help me through it',
    helpSubtitle: 'Get immediate in-app help',
    a11yDismiss: 'Dismiss emergency options',
  },
  exercises: {
    title: 'Today’s exercises',
    a11yEdit: 'Edit exercises',
    allDoneTitle: 'All exercises completed!',
    allDoneSubtitle: 'Come back later to repeat them.',
    statusCompleted: 'Completed',
    statusStart: 'Start',
  },
  insight: {
    openCalendar: 'Open calendar',
  },
  menuRow: {
    a11yPremium: '{label} - requires Premium',
    a11yWithValue: '{label}, {value}',
  },
} satisfies NamespaceOf<'common'>;
