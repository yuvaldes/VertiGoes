import type { NamespaceOf } from '../index';

export const legal = {
  privacy: { title: 'הצהרת פרטיות' },
  terms: { title: 'תנאי שימוש' },
  health: { title: 'הצהרת בריאות וכתב ויתור רפואי' },
  accessibility: { title: 'הצהרת נגישות' },
  menuTitle: 'מסמכים משפטיים',
} satisfies NamespaceOf<'legal'>;
