/**
 * The Home cluster: the edit-exercises screen, the calendar, and a day's full record.
 *
 * Counted strings are split into `one` / `other` rather than assembled from fragments,
 * because Hebrew agrees the verb with the number and cannot reuse an English word order.
 */
export const home = {
  exercises: {
    title: 'Today’s exercises',
  },
  calendar: {
    title: 'Calendar',
  },
  dayDetail: {
    empty: 'Nothing was recorded on this day.',
    emergencyTitle: 'You called your emergency contact',
    emergencyContact: '{name} ({relationship}) - {phone}',
    episodes: {
      one: 'You had {count} episode',
      other: 'You had {count} episodes',
    },
    helpTitle: 'You got in-app help',
    exercisesTitle: 'Exercises you did',
    /** The chips only ever record 5 to 9 hours, so there is no singular to translate. */
    sleptHours: 'You slept for {hours} hours',
    livTitle: 'What you talked about with Liv',
  },
  editExercises: {
    dismissAll: 'Dismiss all',
    libraryLabel: 'ALL EXERCISES',
    a11yAdd: 'Add {title} to today',
  },
} as const;
