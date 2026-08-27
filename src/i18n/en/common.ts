/**
 * Strings that genuinely belong to no single screen.
 *
 * Deliberately tiny. A key earns a place here only when three or more unrelated screens
 * render the same word for the same reason; anything else lives in its own namespace, where
 * the team that owns the screen can reword it without breaking somebody else's copy.
 *
 * The shared components under `src/components` are the other resident: `BottomBar`, the
 * emergency sheet and the menu rows are rendered by every tab rather than by one screen, so
 * their copy has no screen namespace to belong to.
 */
export const common = {
  action: {
    back: 'Back',
    close: 'Close',
    done: 'Done',
    dismiss: 'Dismiss',
  },
  answer: {
    yes: 'Yes',
    no: 'No',
  },
  /**
   * Endonyms: a language is named in itself in every locale, so these two are the same
   * string in `en` and `he`. They are keyed anyway so the picker can go through `t()`
   * like everything else.
   */
  language: {
    en: 'English',
    he: 'עברית',
  },
  header: {
    greeting: 'Hello, {firstName}',
    /**
     * The count and the rest of the sentence are two strings because they are two colours
     * on screen. Each half is a whole phrase rather than a word, so a translator can order
     * the words inside it freely; only the two halves themselves are pinned in sequence.
     */
    taskCountOne: '{count} task',
    taskCountOther: '{count} tasks',
    tasksWaitingOne: 'is waiting for you today',
    tasksWaitingOther: 'are waiting for you today',
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
} as const;
