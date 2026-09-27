export const feedback = {
  bugReport: {
    title: 'Report a bug',
    intro: 'Something not working as expected? Tell us about it so we can improve VertiGoes.',
    descriptionLabel: 'What happened?',
    descriptionPlaceholder:
      'Describe what happened, what you expected, and the steps that led to the problem.',
    count: '{count} of {max} characters',
    signInNote: 'Sign in to send your report. Your text will stay here while you sign in.',
    signInCta: 'Sign in to send',
    signingIn: 'Signing in…',
    send: 'Send report',
    sending: 'Sending…',
    error: 'We couldn’t send your report. Your text is still here. Please try again.',
    rateLimited: 'You’ve reached the report limit. Please try again later. Your text is still here.',
    retry: 'Try again',
    unavailable: 'Bug reports are unavailable right now. Please try again later.',
    successTitle: 'Report sent',
    successMessage: 'Thank you for helping us improve VertiGoes.',
  },
} as const;
