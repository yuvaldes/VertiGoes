/**
 * Mock directory of professionals the user can book with.
 *
 * TODO(content): replace with a real directory. Names, clinics and contact details below are
 * invented — the phone numbers are in the reserved 555 range so a misdial during development
 * cannot reach a real person, and the emails use example.com for the same reason.
 * TODO(asset): `photoUrl` below points at randomuser.me placeholder portraits — stand-ins for
 * real headshots, same spirit as the reserved phone numbers. Swap for the real directory's
 * photos together with everything else here.
 */

import type { TKey } from '../i18n';

/**
 * `name`, `phone` and `email` are the person's own details and stay literals — a name is not
 * translated. Everything else here is copy about them, so it travels as a key.
 */
export type Professional = {
  id: string;
  name: string;
  professionKey: TKey;
  yearsExperience: number;
  clinicKey: TKey;
  cityKey: TKey;
  languageKeys: TKey[];
  /** Shown on the detail page. */
  aboutKey: TKey;
  specialtyKeys: TKey[];
  phone: string;
  email: string;
  /** Whether they currently take new patients — surfaced on the card. */
  acceptingPatients: boolean;
  /** Placeholder portrait. `ProfessionalAvatar` falls back to initials if this fails to load. */
  photoUrl: string;
};

export const professionals: Professional[] = [
  {
    id: 'noa-berger',
    name: 'Dr. Noa Berger',
    professionKey: 'data.pro.noaBerger.profession',
    yearsExperience: 14,
    clinicKey: 'data.pro.noaBerger.clinic',
    cityKey: 'data.city.herzliya',
    languageKeys: ['data.languageName.hebrew', 'data.languageName.english'],
    aboutKey: 'data.pro.noaBerger.about',
    specialtyKeys: [
      'data.specialty.bppv',
      'data.specialty.vestibularMigraine',
      'data.specialty.menieres',
    ],
    phone: '+1-555-0181',
    email: 'n.berger@example.com',
    acceptingPatients: true,
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: 'amir-cohen',
    name: 'Amir Cohen',
    professionKey: 'data.pro.amirCohen.profession',
    yearsExperience: 9,
    clinicKey: 'data.pro.amirCohen.clinic',
    cityKey: 'data.city.telAviv',
    languageKeys: [
      'data.languageName.hebrew',
      'data.languageName.english',
      'data.languageName.russian',
    ],
    aboutKey: 'data.pro.amirCohen.about',
    specialtyKeys: [
      'data.specialty.gazeStabilisation',
      'data.specialty.balanceRetraining',
      'data.specialty.postViralRecovery',
    ],
    phone: '+1-555-0192',
    email: 'a.cohen@example.com',
    acceptingPatients: true,
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 'yael-shani',
    name: 'Dr. Yael Shani',
    professionKey: 'data.pro.yaelShani.profession',
    yearsExperience: 21,
    clinicKey: 'data.pro.yaelShani.clinic',
    cityKey: 'data.city.telAviv',
    languageKeys: ['data.languageName.hebrew', 'data.languageName.english'],
    aboutKey: 'data.pro.yaelShani.about',
    specialtyKeys: [
      'data.specialty.centralVertigo',
      'data.specialty.migraine',
      'data.specialty.neuroOtology',
    ],
    phone: '+1-555-0143',
    email: 'y.shani@example.com',
    acceptingPatients: false,
    photoUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
  },
  {
    id: 'daniel-rosen',
    name: 'Daniel Rosen',
    professionKey: 'data.pro.danielRosen.profession',
    yearsExperience: 6,
    clinicKey: 'data.pro.danielRosen.clinic',
    cityKey: 'data.city.ramatGan',
    languageKeys: ['data.languageName.hebrew', 'data.languageName.english'],
    aboutKey: 'data.pro.danielRosen.about',
    specialtyKeys: [
      'data.specialty.audiometry',
      'data.specialty.vempTesting',
      'data.specialty.tinnitus',
    ],
    phone: '+1-555-0176',
    email: 'd.rosen@example.com',
    acceptingPatients: true,
    photoUrl: 'https://randomuser.me/api/portraits/men/76.jpg',
  },
  {
    id: 'maya-levi',
    name: 'Maya Levi',
    professionKey: 'data.pro.mayaLevi.profession',
    yearsExperience: 11,
    clinicKey: 'data.pro.mayaLevi.clinic',
    cityKey: 'data.city.jerusalem',
    languageKeys: [
      'data.languageName.hebrew',
      'data.languageName.english',
      'data.languageName.arabic',
    ],
    aboutKey: 'data.pro.mayaLevi.about',
    specialtyKeys: [
      'data.specialty.returnToWork',
      'data.specialty.fallPrevention',
      'data.specialty.homeAdaptation',
    ],
    phone: '+1-555-0158',
    email: 'm.levi@example.com',
    acceptingPatients: true,
    photoUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
];

export function professionalById(id: string): Professional | undefined {
  return professionals.find((professional) => professional.id === id);
}

/** Initials for the portrait placeholder. */
export function initialsOf(name: string): string {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
