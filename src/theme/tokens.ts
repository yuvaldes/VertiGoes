import { Platform, type ViewStyle } from 'react-native';

/**
 * Design tokens lifted verbatim from the VertiGoes Figma library.
 * Figma variable name -> token name, e.g. `Brand/500` -> `color.brand500`.
 */
export const color = {
  white: '#ffffff',
  black: '#000000',

  gray25: '#fdfdfd',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#e9eaeb',
  gray300: '#d5d7da',
  gray400: '#a4a7ae',
  gray500: '#717680',
  gray600: '#535862',
  gray700: '#414651',
  gray900: '#181d27',

  brand25: '#f5faff',
  brand50: '#eff8ff',
  brand100: '#d1e9ff',
  brand200: '#b2ddff',
  brand300: '#84caff',
  brand400: '#53b1fd',
  brand500: '#2e90fa',
  brand600: '#1570ef',

  orange100: '#ffead5',
  orange200: '#fddcab',
  orange400: '#fd853a',
  orange500: '#fb6514',
  orange600: '#ec4a0a',

  success100: '#d1fadf',
  success200: '#a6f4c5',
  success400: '#32d583',
  success500: '#12b76a',
  success600: '#039855',

  /** The task cards on Home each own a hue ramp: turquoise = feeling, purple = sleep. */
  turquoise25: '#effefa',
  turquoise50: '#cafdf2',
  turquoise100: '#95fae5',
  turquoise400: '#0fd2bb',
  turquoise600: '#0b7a70',

  purple25: '#fcfaff',
  purple100: '#f4ebff',
  purple200: '#e9d7fe',
  purple400: '#b692f6',
  purple600: '#7f56d9',

  /** Figma `accents/yellow` — the mid band of the weekly episode chart. */
  yellow: '#ffcc00',

  error25: '#fffbfa',
  error400: '#f97066',
  error500: '#f04438',

  /**
   * Not present in the pulled Figma variable set — the emergency sheet needs a tinted
   * surface and border, matched to the mock from the same Untitled UI error ramp.
   */
  error50: '#fef3f2',
  error100: '#fee4e2',
} as const;

/** Loaded in App.tsx via `useFonts`. Cal Sans is the display face, Inter the body face. */
export const font = {
  display: 'CalSans_400Regular',
  body: 'Inter_400Regular',
  /** Only the emergency flow's question, which the design sets in Inter Medium rather than
   *  the display face - at 30pt Cal Sans would shout, and this screen is read under duress. */
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/**
 * The faces Hebrew uses instead. Only the display face differs.
 *
 * Neither bundled family maps U+0590-U+05FF, so Hebrew is drawn by whatever the platform
 * substitutes whichever family we name. Naming Cal Sans is still the worst of the options: a
 * heading that mixes scripts ("Liv", a price, a digit) would set its Latin run in a quirky
 * display face right beside the system Hebrew face. Inter sits far closer to it, so Hebrew
 * borrows the body face for display too — Bold, to keep the same weight of emphasis Cal Sans
 * carries in the Latin headings — and the brand voice is spent only on Latin.
 *
 * Do not read this directly. `useDisplayFont()` in src/i18n picks between the two.
 */
export const fontHebrew = {
  display: Platform.select<string>({
    // A CSS stack is legal only on web, and it is worth having: it lets us name the Hebrew
    // fallback rather than leaving it to the browser's default sans.
    web: 'Inter_700Bold, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    default: 'Inter_700Bold',
  }),
} as const;

/**
 * Figma effect styles. Web gets the exact multi-layer shadow; native approximates
 * with the dominant layer since RN shadow props only express one.
 */
export const shadow = {
  /** shadow-xs: 0 1 2 rgba(10,13,18,.05) */
  xs: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 1px 2px 0px rgba(10, 13, 18, 0.05)' },
    ios: {
      shadowColor: '#0a0d12',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  })!,

  /** shadow-sm: 0 1 2 rgba(10,13,18,.06), 0 1 3 rgba(10,13,18,.10) */
  sm: Platform.select<ViewStyle>({
    web: {
      boxShadow:
        '0px 1px 2px 0px rgba(10, 13, 18, 0.06), 0px 1px 3px 0px rgba(10, 13, 18, 0.10)',
    },
    ios: {
      shadowColor: '#0a0d12',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  })!,

  /** shadow-md: 0 2 4 -2 rgba(10,13,18,.06), 0 4 8 -2 rgba(10,13,18,.10) */
  md: Platform.select<ViewStyle>({
    web: {
      boxShadow:
        '0px 2px 4px -2px rgba(10, 13, 18, 0.06), 0px 4px 8px -2px rgba(10, 13, 18, 0.10)',
    },
    ios: {
      shadowColor: '#0a0d12',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  })!,

  /** shadow-2xl: 0 24 48 -12 rgba(10,13,18,.18) */
  xxl: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 24px 48px -12px rgba(10, 13, 18, 0.18)' },
    ios: {
      shadowColor: '#0a0d12',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: { elevation: 16 },
    default: {},
  })!,
} as const;

/** The Figma frame these measurements were taken against (iPhone 14/15 Pro). */
export const frame = {
  width: 393,
  height: 852,
  statusBarHeight: 59,
  homeIndicatorHeight: 34,
  /** Frame 17 sits at x=16 inside `body`. */
  gutter: 16,
  /**
   * Distance from the top of `body` to the brand row — the single source of truth for the
   * app header's position. Every screen must go through `AppHeader`, which owns this.
   *
   * The design file disagrees with itself here: the Home and Edit frames put their content
   * root at y=8 while the Calendar frame uses y=16, which put the header 8px lower on
   * Calendar and Liv. 8 wins because it's what Home — the screen users see most — uses.
   */
  headerTop: 8,
} as const;
