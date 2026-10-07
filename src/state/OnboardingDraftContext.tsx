import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { initialOnboardingAnswers, type OnboardingAnswers } from '../data/onboarding';

export const DRAFT_STORAGE_KEY = '@vertigoes/onboarding-draft/v1';
export const CONSENT_TYPES = ['terms', 'privacy', 'health_data_processing', 'ai_processing', 'research', 'marketing'] as const;
export type ConsentType = typeof CONSENT_TYPES[number];
export type ConsentAnswers = Record<ConsentType, boolean>;
export const initialConsentAnswers: ConsentAnswers = {
  terms: false, privacy: false, health_data_processing: false,
  ai_processing: false, research: false, marketing: false,
};
export type OnboardingDraft = { answers: OnboardingAnswers; step: number; consents: ConsentAnswers; completed: boolean };
const emptyDraft = (): OnboardingDraft => ({ answers: initialOnboardingAnswers, step: 0, consents: initialConsentAnswers, completed: false });
type DraftValue = {
  draft: OnboardingDraft; ready: boolean;
  patch: (partial: Partial<OnboardingAnswers>) => void; setStep: (step: number) => void;
  setCompleted: (completed: boolean) => void; setConsent: (type: ConsentType, accepted: boolean) => void;
  clear: () => Promise<void>;
};
const DraftContext = createContext<DraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  useEffect(() => { void AsyncStorage.getItem(DRAFT_STORAGE_KEY).then((raw) => {
    if (raw) {
      try { setDraft({ ...emptyDraft(), ...JSON.parse(raw), answers: { ...initialOnboardingAnswers, ...JSON.parse(raw).answers }, consents: { ...initialConsentAnswers, ...JSON.parse(raw).consents } }); } catch { void AsyncStorage.removeItem(DRAFT_STORAGE_KEY); }
    }
  }).finally(() => setReady(true)); }, []);
  const update = useCallback((change: (value: OnboardingDraft) => OnboardingDraft) => setDraft((current) => {
    const next = change(current); void AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next)); return next;
  }), []);
  const clear = useCallback(async () => { setDraft(emptyDraft()); await AsyncStorage.removeItem(DRAFT_STORAGE_KEY); }, []);
  return <DraftContext.Provider value={{ draft, ready,
    patch: (partial) => update((d) => ({ ...d, answers: { ...d.answers, ...partial } })),
    setStep: (step) => update((d) => ({ ...d, step })), setCompleted: (completed) => update((d) => ({ ...d, completed })),
    setConsent: (type, accepted) => update((d) => ({ ...d, consents: { ...d.consents, [type]: accepted } })), clear,
  }}>{children}</DraftContext.Provider>;
}
export function useOnboardingDraft() { const value = useContext(DraftContext); if (!value) throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider'); return value; }
