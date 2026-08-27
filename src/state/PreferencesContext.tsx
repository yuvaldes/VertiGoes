import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'he';

/**
 * What the Language row shows. Hebrew is written in Hebrew, as it would be to a Hebrew reader.
 *
 * These are endonyms, so they are the same string in every locale and there is nothing for
 * `t()` to choose between. Kept here rather than read back out of the translation trees so
 * this module stays free of any import from src/i18n, which imports it.
 */
export const LANGUAGE_LABEL: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
};

/**
 * Shown beside each name in the picker. A flag stands for a country rather than a language,
 * which is always a rough fit — English is pinned to the UK here simply because one had to be
 * chosen. Swap the emoji if the audience expects otherwise.
 */
export const LANGUAGE_FLAG: Record<Language, string> = {
  en: '🇬🇧',
  he: '🇮🇱',
};

type PreferencesValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

/**
 * User preferences.
 *
 * Currently only the language choice — but it is now load-bearing rather than cosmetic. It is
 * the single source of truth for the whole i18n layer: `src/i18n` reads `language` from here
 * and derives the translations, the writing direction and the display face from it. Nothing
 * else may store a language, or the two copies will drift.
 *
 * Web mirrors the layout as soon as this changes. Native cannot — see `useDirection()` in
 * src/i18n, whose `restartRequired` says so honestly rather than pretending the flip happened.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside a PreferencesProvider');
  return value;
}
