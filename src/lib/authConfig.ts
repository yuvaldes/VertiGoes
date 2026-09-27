export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
export const CAPTCHA_REQUIRED = TURNSTILE_SITE_KEY.length > 0;
