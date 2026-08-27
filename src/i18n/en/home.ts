/**
 * The Home cluster: Home, the calendar, a day's full record, and the exercise videos screen
 * reached from Home.
 *
 * Counted strings are split into `one` / `other` rather than assembled from fragments,
 * because Hebrew agrees the verb with the number and cannot reuse an English word order.
 */
export const home = {
  /**
   * Two screens in this namespace title today's list — the edit screen and the videos
   * screen — and they are the same list, so they share one key.
   */
  exercises: {
    title: 'Today’s exercises',
  },
  status: {
    /** The name is inside the string: Hebrew puts the greeting and the name the other way up. */
    greeting: {
      morning: 'Good morning, {firstName}',
      afternoon: 'Good afternoon, {firstName}',
      evening: 'Good evening, {firstName}',
    },
    allDone: 'Come back tomorrow to keep your streak!',
    tasksWaiting: {
      one: '{count} task is waiting for you today!',
      other: '{count} tasks are waiting for you today!',
    },
    streak: '{days} day streak',
    feelingOpen: 'How are you feeling currently?',
    feelingDone: 'Thanks! Letting us know helps us improve',
    sleepOpen: 'How many hours did you sleep?',
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
  exerciseVideos: {
    a11yEdit: 'Edit exercises',
    emptyTitle: 'Nothing scheduled today',
    emptyBody: 'Add exercises with the pencil above.',
    dismissAll: 'Dismiss all for today',
    a11yCard: '{title}, {duration}, {state}',
    a11yCompleted: 'completed',
    a11yNotStarted: 'not started',
    statusCompleted: 'Completed',
    statusNotStarted: 'Not started',
  },
} as const;
