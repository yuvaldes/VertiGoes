import type { NamespaceOf } from '../index';

export const feedback = {
  bugReport: {
    title: 'דיווח על תקלה',
    intro: 'משהו לא עובד כצפוי? ספרו לנו כדי שנוכל לשפר את VertiGoes.',
    descriptionLabel: 'מה קרה?',
    descriptionPlaceholder: 'תארו מה קרה, מה ציפיתם שיקרה ומה עשיתם לפני שהבעיה הופיעה.',
    count: '{count} מתוך {max} תווים',
    signInNote: 'כדי לשלוח את הדיווח, יש להתחבר. הטקסט יישאר כאן בזמן ההתחברות.',
    signInCta: 'התחברו כדי לשלוח',
    signingIn: 'מתחברים…',
    send: 'שליחת דיווח',
    sending: 'שולחים…',
    error: 'לא הצלחנו לשלוח את הדיווח. הטקסט עדיין כאן. נסו שוב.',
    rateLimited: 'הגעתם למגבלת הדיווחים. נסו שוב מאוחר יותר. הטקסט עדיין כאן.',
    retry: 'נסו שוב',
    unavailable: 'לא ניתן לשלוח דיווחים כרגע. נסו שוב מאוחר יותר.',
    successTitle: 'הדיווח נשלח',
    successMessage: 'תודה שעזרתם לנו לשפר את VertiGoes.',
  },
} satisfies NamespaceOf<'feedback'>;
