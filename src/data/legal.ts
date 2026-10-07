import documents from './legalDocuments.json';
import type { Locale } from '../i18n';

export type LegalDocumentKey = 'privacy' | 'terms' | 'health' | 'accessibility';

export const LEGAL_VERSION = documents.version;
export const LEGAL_UPDATED = documents.updated;

export function legalPages(document: LegalDocumentKey, locale: Locale): readonly string[] {
  if (document === 'terms') {
    return [
      'Terms of Service\nVertiGoes app · Effective: 27 September 2026 · Version 1.0\n\nBy creating an account or using VertiGoes, you confirm that you have read and accepted these Terms, the Privacy Statement, and the Health Statement & Medical Disclaimer.',
      'What VertiGoes provides\nVertiGoes provides educational content and tools for people living with dizziness, vertigo, and balance disorders. It is not a medical device, does not diagnose, and is not a substitute for examination, diagnosis, treatment, or a rehabilitation plan from a licensed clinician. It does not monitor your condition or summon emergency help. In an emergency, call local emergency services immediately.',
      'Your responsibilities\nUse the app lawfully and keep your account credentials secure. You are responsible for information you enter and for consulting an appropriate clinician before undertaking exercises or manoeuvres. Do not make medical decisions or change treatment, medication, or dosage based solely on the app.',
      'Accounts, changes, and availability\nSome features require an account and explicit consent to process health information. Our collection and use of personal information is described in the Privacy Statement. We may change, suspend, or discontinue features as the app develops, and may update these Terms with a new effective date.',
      'Disclaimers and governing law\nThe service is provided “as is” and “as available.” To the maximum extent permitted by law, VertiGoes and those acting on its behalf are not liable for loss, injury, damage, or harm arising from use of, inability to use, or reliance on the app or its content. Israeli law applies, and the competent courts of the Tel Aviv-Jaffa district have jurisdiction. Questions: vertigoesmaya@gmail.com.',
    ];
  }
  return documents[document][locale];
}

export const LEGAL_PUBLIC_PATHS: Record<LegalDocumentKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  health: '/health-disclaimer',
  accessibility: '/accessibility',
};
