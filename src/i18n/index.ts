/**
 * Translation, writing direction, locale-aware dates, and the one font that has to change
 * with the language. Everything the rest of the app needs for i18n comes from this module.
 *
 * The language itself is not stored here: `PreferencesContext` already owns it, and a second
 * copy would drift. This module reads that one value and derives everything else from it.
 */

import { useEffect, useMemo } from 'react';
import { I18nManager, Platform, type TextStyle } from 'react-native';

import { usePreferences } from '../state/PreferencesContext';
import { font, fontHebrew } from '../theme/tokens';
import { en } from './en';
import { he } from './he';

declare module 'react-native' {
  /**
   * react-native-web reads `dir` off an element's props and wraps it in its own
   * LocaleProvider, which is the only thing that flips its logical style props
   * (`marginStart`, `start`, the corner radii). RN's `ViewProps` has no such prop and native
   * ignores it, so declare it once here instead of casting at the call site in PhonePreview.
   */
  interface ViewProps {
    dir?: 'ltr' | 'rtl';
  }
}

export type Locale = 'en' | 'he';
export type Direction = 'ltr' | 'rtl';

// ---------------------------------------------------------------------------
// Key typing. The English tree is the contract.
// ---------------------------------------------------------------------------

export type Translations = typeof en;

/** Every dot path that reaches a string. Object nodes are not keys. */
type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type TKey = Leaves<Translations>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};

/** What a locale tree may look like: same shape as English, every branch optional. */
export type PartialTranslations = DeepPartial<Translations>;

/** What one translated namespace file may look like. Used by every `he/<ns>.ts`. */
export type NamespaceOf<N extends keyof Translations> = DeepPartial<Translations[N]>;

export type TParams = Readonly<Record<string, string | number>>;
export type TFunc = (key: TKey, params?: TParams) => string;

// ---------------------------------------------------------------------------
// Lookup and interpolation
// ---------------------------------------------------------------------------

const TREES: Record<Locale, unknown> = { en, he };

const warned = new Set<string>();

/**
 * One line per problem, not one per render. A missing key is usually rendered inside a list,
 * so an unthrottled warn buries the rest of the console within a second.
 */
function warnOnce(message: string): void {
  if (!__DEV__ || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, key: string, params?: TParams): string {
  if (!template.includes('{')) return template;
  return template.replace(PLACEHOLDER, (marker, name: string) => {
    const value = params?.[name];
    if (value === undefined) {
      warnOnce(`i18n: "${key}" expects a {${name}} param, which was not supplied.`);
      return marker;
    }
    return String(value);
  });
}

/**
 * The non-React entry point, for data modules and helpers that have a locale in hand but no
 * hook to call. Inside a component use `useT()` instead.
 */
export function t(locale: Locale, key: TKey, params?: TParams): string {
  const localized = lookup(TREES[locale], key);
  if (localized !== undefined) return interpolate(localized, key, params);

  const english = lookup(TREES.en, key);
  if (english === undefined) {
    // Unreachable through the typed API; possible if a tree is edited without its sibling.
    warnOnce(`i18n: no string for key "${key}" in any locale.`);
    return key;
  }
  if (locale !== 'en') {
    warnOnce(`i18n: "${key}" is missing from the ${locale} tree, falling back to English.`);
  }
  return interpolate(english, key, params);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useLocale(): Locale {
  return usePreferences().language;
}

export function useT(): TFunc {
  const locale = useLocale();
  return useMemo<TFunc>(() => (key, params) => t(locale, key, params), [locale]);
}

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

const RTL_LOCALES: readonly Locale[] = ['he'];

export function isRTLLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * The direction the layout engine is actually running in, captured once.
 *
 * `I18nManager.isRTL` is a load-time snapshot on native — the module reads the native
 * constants when it is first evaluated and never re-reads them, so it keeps reporting this
 * value for the whole JS session no matter what `forceRTL` is told. On web the entire module
 * is a stub whose `isRTL` is `undefined`, so it is not consulted there at all.
 */
const NATIVE_LAYOUT_IS_RTL = Platform.OS === 'web' ? false : I18nManager.isRTL === true;

export type DirectionState = {
  /** What is on screen right now, not what the user has asked for. */
  direction: Direction;
  isRTL: boolean;
  /**
   * Native only. True when the language preference wants a direction the running process
   * cannot switch to. The preference is already persisted for the next launch; the layout
   * catches up when the app is restarted.
   */
  restartRequired: boolean;
};

export function directionFor(locale: Locale): DirectionState {
  const wantsRTL = isRTLLocale(locale);
  // Web re-renders into the new direction the moment the preference changes. Native cannot:
  // Yoga was configured at process start, so the honest answer until the next launch is the
  // direction the app is laid out in, not the one that was just picked. Reporting the wish
  // instead would flip the icons and the gesture edge against an unflipped layout.
  const effectiveRTL = Platform.OS === 'web' ? wantsRTL : NATIVE_LAYOUT_IS_RTL;
  return {
    direction: effectiveRTL ? 'rtl' : 'ltr',
    isRTL: effectiveRTL,
    restartRequired: Platform.OS !== 'web' && wantsRTL !== NATIVE_LAYOUT_IS_RTL,
  };
}

export function useDirection(): DirectionState {
  const locale = useLocale();
  return useMemo(() => directionFor(locale), [locale]);
}

/**
 * Applies the direction to the platform. Call exactly once, as high in the tree as possible:
 * `PhonePreview` already does, and nothing else should.
 *
 * Returns the value for the web `dir` prop. On native it persists the choice through
 * `I18nManager` and returns the direction the process is still running in — see
 * `restartRequired`. There is no in-place reload available: both setters only write to native
 * storage, and `expo-updates`, which would let us restart the bundle, is not a dependency.
 */
export function useApplyDirection(): Direction {
  const locale = useLocale();
  const { direction } = useDirection();
  const wantsRTL = isRTLLocale(locale);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    I18nManager.allowRTL(wantsRTL);
    I18nManager.forceRTL(wantsRTL);
  }, [wantsRTL]);

  return direction;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

/**
 * Frozen per locale so the returned style keeps a stable identity across renders and does
 * not defeat memoisation at the call sites that spread it.
 */
const DISPLAY_FONT: Record<Locale, TextStyle> = {
  en: { fontFamily: font.display },
  he: { fontFamily: fontHebrew.display },
};

/**
 * The display face for the current language, as a style fragment to layer over a static one:
 *
 *     const displayFont = useDisplayFont();
 *     <Text style={[styles.title, displayFont]}>{t('home.calendar.title')}</Text>
 *
 * It has to be a hook rather than a token because `StyleSheet.create` runs once at module
 * scope, long before a language is chosen. `styles.title` still declares
 * `fontFamily: font.display`, which is what English renders and what the file documents;
 * this only overrides it under Hebrew. Body text needs no equivalent, because Inter is the
 * body face in both languages.
 */
export function useDisplayFont(): TextStyle {
  return DISPLAY_FONT[useLocale()];
}

// ---------------------------------------------------------------------------
// Locale-aware dates
// ---------------------------------------------------------------------------

/**
 * The BCP 47 tag behind each language. English is pinned to en-GB rather than en-US because
 * the design writes dates day-first ("Tuesday, 4 August"). Also the tag to pass to
 * `Intl.NumberFormat` for prices, percentages and units, so those stay consistent with dates.
 */
const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', he: 'he-IL' };

export function intlLocale(locale: Locale): string {
  return INTL_LOCALE[locale];
}

export type WeekdayStyle = 'long' | 'short' | 'narrow';

/**
 * Hermes ships Intl on both platforms in this Expo version, but a stripped engine build would
 * make every date throw at render. The English tables below are the parachute. They are also
 * exactly what Intl produces for en-GB, so migrating a screen to these helpers changes nothing
 * about the English rendering.
 */
const MONTHS_LONG_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS_EN: Record<WeekdayStyle, string[]> = {
  long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const formatters = new Map<string, Intl.DateTimeFormat | null>();

function dateFormatter(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat | null {
  const cacheKey = `${locale}:${JSON.stringify(options)}`;
  const cached = formatters.get(cacheKey);
  if (cached !== undefined) return cached;

  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), options);
  } catch {
    warnOnce('i18n: Intl.DateTimeFormat is unavailable, dates fall back to English.');
  }
  formatters.set(cacheKey, formatter);
  return formatter;
}

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

/** Index 0 is January, matching `Date.getMonth()`. */
export function monthNames(locale: Locale, style: 'long' | 'short' = 'long'): string[] {
  // en-GB's Intl short form is "Sept" for September (4 letters), which breaks the fixed-width
  // month label in the calendar grid, so English always uses the hardcoded 3-letter table.
  if (locale === 'en' && style === 'short') return [...MONTHS_SHORT_EN];

  const formatter = dateFormatter(locale, { month: style });
  if (!formatter) return [...(style === 'long' ? MONTHS_LONG_EN : MONTHS_SHORT_EN)];
  // Mid-month, so no timezone offset can push a sample into a neighbouring month.
  return MONTH_INDEXES.map((month) => formatter.format(new Date(2021, month, 15)));
}

/**
 * Index 0 is Sunday by default, matching `Date.getDay()`. Pass `firstDay: 1` for the
 * Monday-first ordering the weekly chart uses. Hebrew weeks also start on Sunday, so the
 * calendar grid's ordering is right in both languages and only the labels change.
 */
export function weekdayNames(
  locale: Locale,
  style: WeekdayStyle = 'long',
  firstDay: 0 | 1 = 0,
): string[] {
  const formatter = dateFormatter(locale, { weekday: style });
  // 1 Aug 2021 was a Sunday, which is where the calendar grid starts counting.
  const sundayFirst = formatter
    ? WEEKDAY_INDEXES.map((offset) => formatter.format(new Date(2021, 7, 1 + offset)))
    : [...WEEKDAYS_EN[style]];
  return firstDay === 0 ? sundayFirst : [...sundayFirst.slice(1), sundayFirst[0]];
}

const EN_ORDINAL_SUFFIX: Record<string, string> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
};

/** `undefined` means "not tried yet", `null` means "tried, and Intl.PluralRules is absent". */
let ordinalRules: Intl.PluralRules | null | undefined;

function enOrdinalSuffix(day: number): string {
  if (ordinalRules === undefined) {
    try {
      ordinalRules = new Intl.PluralRules('en', { type: 'ordinal' });
    } catch {
      ordinalRules = null;
    }
  }
  if (ordinalRules) return EN_ORDINAL_SUFFIX[ordinalRules.select(day)] ?? 'th';

  // 11th, 12th and 13th break the pattern the last digit would otherwise give.
  if (day % 100 >= 11 && day % 100 <= 13) return 'th';
  if (day % 10 === 1) return 'st';
  if (day % 10 === 2) return 'nd';
  if (day % 10 === 3) return 'rd';
  return 'th';
}

/** 'Tuesday, 4 August' / 'יום שלישי, 4 באוגוסט'. The day-detail screen title. */
export function formatLongDate(locale: Locale, date: Date): string {
  if (locale === 'en') {
    // Composed by hand rather than by Intl: en-GB drops the comma and en-US puts the month
    // first, and the Figma title has both. Hebrew has no such constraint, so it takes the
    // locale's own pattern, which also gets the "ב" prefix on the month right.
    return `${weekdayNames('en')[date.getDay()]}, ${date.getDate()} ${monthNames('en')[date.getMonth()]}`;
  }
  const formatter = dateFormatter(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return formatter ? formatter.format(date) : formatLongDate('en', date);
}

/**
 * 'July 24th' / '24 ביולי'. Home's header, beside the calendar button.
 *
 * The ordinal suffix is an English habit with no Hebrew equivalent, so Hebrew gets a plain
 * numeral. Forcing a suffix in would read as a typo to a Hebrew speaker.
 */
export function formatMonthDay(locale: Locale, date: Date): string {
  if (locale === 'en') {
    const day = date.getDate();
    return `${monthNames('en')[date.getMonth()]} ${day}${enOrdinalSuffix(day)}`;
  }
  const formatter = dateFormatter(locale, { day: 'numeric', month: 'long' });
  return formatter ? formatter.format(date) : formatMonthDay('en', date);
}

/** 'August 2026' / 'אוגוסט 2026'. The calendar's month header. */
export function formatMonthYear(locale: Locale, date: Date): string {
  const formatter = dateFormatter(locale, { month: 'long', year: 'numeric' });
  if (formatter) return formatter.format(date);
  return `${monthNames('en')[date.getMonth()]} ${date.getFullYear()}`;
}

export type DateFormats = {
  longDate: (date: Date) => string;
  monthDay: (date: Date) => string;
  monthYear: (date: Date) => string;
  monthNames: (style?: 'long' | 'short') => string[];
  weekdayNames: (style?: WeekdayStyle, firstDay?: 0 | 1) => string[];
};

/** The same formatters bound to the current language, for use inside components. */
export function useDateFormat(): DateFormats {
  const locale = useLocale();
  return useMemo<DateFormats>(
    () => ({
      longDate: (date) => formatLongDate(locale, date),
      monthDay: (date) => formatMonthDay(locale, date),
      monthYear: (date) => formatMonthYear(locale, date),
      monthNames: (style) => monthNames(locale, style),
      weekdayNames: (style, firstDay) => weekdayNames(locale, style, firstDay),
    }),
    [locale],
  );
}
