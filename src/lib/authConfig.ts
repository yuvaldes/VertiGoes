// Turnstile site keys are public and intentionally ship in browser bundles. Render can override
// this if VertiGoes moves to a different widget; the secret remains only in Supabase Auth.
const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAFFJMgEJ8ie236s7';
export const TURNSTILE_SITE_KEY =
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() || DEFAULT_TURNSTILE_SITE_KEY;
export const CAPTCHA_REQUIRED = TURNSTILE_SITE_KEY.length > 0;
