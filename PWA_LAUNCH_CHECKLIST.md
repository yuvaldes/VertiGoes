# Public PWA launch

## Present in this checkout

- Install manifest, 192/512px icons, Apple touch icon, responsive web app.
- Service worker with a generic offline page. It does not cache private account data or
  support offline record editing; account features require a connection.
- Google and email auth, confirmation-required signup, password reset, profile and calendar
  persistence, bug reports, and local migration tests for RLS and write quotas.
- Emergency guided help; saved-contact dialing, without sample phone numbers or claiming
  that opening the phone app proves a completed call.

## Confirmed against Supabase on 2026-09-26

- Google and email providers enabled; Apple disabled; email confirmation required.
- Anonymous table requests and invalid JWTs denied.
- Default auth return destination is `http://localhost:8081/`.
  This is a Mac development URL, not a public or phone URL.

These checks do not prove successful authenticated writes, cross-account isolation in the
deployed database, email delivery, or a complete Google sign-in round trip.

## Before inviting public users

1. In Render, verify the production branch, build variables, HTTPS URL, and deployed commit.
   Build with `npm ci && npm run typecheck && npm test && npm run build:web`; publish `dist`.
   Configure root navigation fallback and inspect security/cache headers. Keep production
   releases deliberate; use a separate staging site and Supabase project.
2. In Supabase Authentication → URL Configuration, set Site URL to the public HTTPS app
   address and allow that address with a trailing slash in Redirect URLs. Keep
   `http://localhost:8081/` for Mac testing. For phone browser testing, explicitly allow the
   Mac's LAN HTTP address with port 8081 and trailing slash. Do not use localhost on a phone.
   Google Cloud's callback remains the Supabase `/auth/v1/callback` URL.
3. Complete Google login in the browser/PWA, reload, sign out, and sign in again. OAuth in
   Expo Go is not the supported test path; use web or a development/production native build.
4. Configure production SMTP, then test signup confirmation, password reset, delivery,
   expiration, and resend behavior with non-team email addresses. Configure CAPTCHA and
   rate limits together with the app's Turnstile site key if enabling CAPTCHA.
5. Publish actual privacy/disclaimer pages and replace the placeholder consent links.
   The account-deletion endpoint, UI, and database scrubbing migration are implemented;
   deploy them, test with a disposable account, and state the bug-metadata retention period
   in the privacy policy.
6. Verify deployed migrations, grants, RLS, quotas, backups, and retention. Test with two
   controlled user accounts: profiles/calendar persist after reload; neither account can
   read or write the other's data; bug reports remain private.
7. On iOS Safari and Android Chrome, test installation, standalone launch, online/offline
   behavior, OAuth return, record saving, emergency-sheet close, saved-contact dialing,
   Hebrew layout, and bug-report focus/submit behavior. Do not place real emergency calls
   during testing.

Unfinished content/services can remain clearly marked as coming soon for an initial release.
They do not need to be advertised as working to make the available features public.
