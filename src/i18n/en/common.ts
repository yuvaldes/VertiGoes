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
  menuRow: {
    a11yPremium: '{label} - requires Premium',
    a11yWithValue: '{label}, {value}',
  },
} as const;
