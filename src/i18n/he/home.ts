import type { NamespaceOf } from '../index';

/**
 * Hebrew for the Home cluster. Every value is still the English source text — this file is
 * the shape the translator fills in, not a translation. Until then each key resolves to the
 * same string it would have fallen back to anyway.
 *
 * Two of these need a Hebrew form English has no slot for: `status.streak` and
 * `dayDetail.sleptHours` both read naturally in the dual (יומיים, שעתיים) at a count of two.
 * The dual needs its own key in `en/home.ts` first — `satisfies` will reject one added here.
 */
export const home = {
  exercises: {
    title: 'Today’s exercises',
  },
  status: {
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
} satisfies NamespaceOf<'home'>;
