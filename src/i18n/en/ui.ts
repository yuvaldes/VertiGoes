/**
 * Copy owned by the shared components under `src/components` from N to Z, plus everything in
 * `calendar/`, `home/` and `liv/`.
 *
 * Grouped by the thing on screen rather than by file, because several of these are rendered
 * twice in two shapes — the feeling question appears inline on Home and again in its bottom
 * sheet, and both eyebrows read "NOT COMPLETED". One key each keeps the two copies from
 * drifting the way the components themselves already did.
 */
export const ui = {
  premiumGate: {
    a11yUnlock: 'Unlock {count} more {itemLabel} with Premium',
    title: '{count} more {itemLabel}',
    cta: 'Get Premium',
  },
  reorderList: {
    a11yReorder: 'Reorder {title}',
    a11yRemove: 'Remove {title}',
  },
  /** The three Home tasks, inline on the card and again inside the sheet each one opens. */
  task: {
    completed: 'COMPLETED',
    notCompleted: 'NOT COMPLETED',
    feelingQuestion: 'How are you feeling currently?',
    feelingAnswered: 'Thanks, I’ll ask you this again later!',
    a11yFeelingGood: 'Feeling good',
    a11yFeelingBad: 'Feeling bad',
    sleepQuestion: 'How many hours did you sleep?',
  },
  calendar: {
    a11yChangeYear: 'Change year, currently {year}',
    a11yDismissYearPicker: 'Dismiss year picker',
    yearPickerTitle: 'Jump to year',
  },
  dayBreakdown: {
    emergencyCall: 'You called your emergency contact',
    episodesOne: 'You had {count} episode',
    episodesOther: 'You had {count} episodes',
    noEpisodes: 'You had no episodes',
    inAppHelp: 'You got in-app help',
    a11yOpenDay: '{line}. See everything recorded on this day.',
    livHeading: 'Liv',
    openConversation: 'Open conversation',
    exercisesHeading: 'Your daily exercises',
    showExercises: 'Show exercises',
    sleptHours: 'You slept for {hours} hours',
    /**
     * The same three words as `data.slot.*`. Kept here so the breakdown does not depend on the
     * shape a data module happens to expose; see the note in DayBreakdown.tsx.
     */
    slotMorning: 'Morning',
    slotMidday: 'Mid-day',
    slotEvening: 'Evening',
  },
  /** Keyed by `LivAction['kind']`, so a new action fails to compile until it has a label. */
  livAction: {
    startHelp: 'Help me through it',
    completeExercise: 'Mark it done',
    dismiss: 'Not now',
    taken: 'Done',
  },
  composer: {
    placeholder: 'Write to Liv...',
    a11yLabel: 'Message Liv',
    a11yDictate: 'Dictate a message',
    a11ySend: 'Send',
    a11yVoiceMode: 'Start voice mode',
  },
  livAvatar: {
    a11yLabel: 'Liv',
  },
  promptChips: {
    greeting: 'Hi {firstName}, I’m Liv',
    body: 'Tell me how you’re feeling and I’ll keep track of it for you. Anything you say here is summarised onto your calendar.',
    dizzyNow: 'I feel dizzy right now',
    episodeEarlier: 'I had an episode earlier',
    sleep: 'How has my sleep been?',
    exercises: 'Remind me about my exercises',
  },
  voiceListening: {
    title: 'Listening…',
    hint: 'Simulated - no audio is recorded',
    a11yStop: 'Stop listening',
  },
  voiceMode: {
    a11yMute: 'Mute microphone',
    a11yUnmute: 'Unmute microphone',
    a11yEnd: 'End voice mode',
  },
  /** Simulated speech. These are put into the user's own turn, so they are the user's voice. */
  cannedPhrase: {
    episodeMorning: 'I had a spinning episode this morning when I got out of bed',
    sleepFiveHours: 'I only slept about five hours last night',
    exercisesDizzy: 'I finished my exercises but the second one made me dizzy',
    unsteady: 'I feel a bit unsteady on my feet today',
  },
} as const;
