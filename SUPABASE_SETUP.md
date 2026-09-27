# Connect VertiGoes to Supabase

The app supports Supabase email/password authentication, email confirmation, password reset,
session restoration, Google OAuth, private onboarding answers, calendar records, and
Menu → Report a bug. Local configuration connects the app to Supabase. Render hosting is
in place according to the project owner; its live settings have not yet been inspected.
Dashboard settings and deployed SQL require separate verification. Google and email sign-in
are enabled in the app; Apple sign-in has been removed. Unfinished content/services show
**To be announced**.

## 1. Project and database

Use a project dedicated to VertiGoes in your existing Supabase account.
In the SQL Editor, run
[the initial migration](supabase/migrations/202609240001_accounts_and_bug_reports.sql) once,
then [the security migration](supabase/migrations/202609240002_security_hardening.sql) once.
Run [the account-deletion migration](supabase/migrations/202609270001_account_deletion.sql)
after both of them.
It creates `profiles`, `day_records`, and `bug_reports` with row-level security.
If the project already contains tables with these names, inspect them before applying the
migration; do not overwrite existing data. The migration is transactional.

If the initial tables already exist from the first setup, **run only the new security migration**.
It adds validators and quota triggers without deleting or rewriting existing records. Run
[the read-only verification SQL](supabase/verify_security.sql) afterward and check the policies,
grants, triggers, and invalid-legacy-row counts. These admin checks do not replace an API test
with two real test users. Do not paste a service-role key into the app to run migrations.

### Database-enforced write limits

| Resource | Short window | UTC calendar day |
| --- | --- | --- |
| Bug reports | 5/hour | 20 |
| Profile saves | 20/minute | 100 |
| Calendar saves | 120/minute | 1,000 |

These are fixed UTC windows (not rolling windows). Counters are atomic, private, and tied to
the auth account, so parallel requests, bulk inserts, timezone changes, and deleting a profile
cannot reset them. A rejected statement rolls back its records and counters. Successful
upserts count once, and duplicate bug-report retries do not consume another slot. Trusted
administrative writes without a user JWT bypass the quotas for maintenance.

Profile/calendar JSON is capped at 16 KiB with required keys, allowed choices, and bounded
values/text. These are data-integrity limits, not clinical validation. Older malformed rows
are retained and counted by the verification SQL; their next save must pass validation.

This is not complete DoS protection: quotas are per account and apply to successful writes,
not reads or rejected requests. Signup CAPTCHA, password policy, request-size/IP controls,
monitoring, and a policy for long-term retention are still needed before public launch.

## 2. Public connection settings

Create `.env.local` using `.env.example` and the project's Connect dialog:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

A legacy `anon` key also works in the publishable-key variable. Never use a secret key,
service-role key, database password, or account password. Expo public variables are bundled
into the client. The local environment file is git-ignored.

Restart Expo after changing these settings: `npx expo start --clear`.
For a hosted web build, provide the same variables to the hosting build environment.
Unconfigured builds keep guest browsing available, but cannot log in or submit reports.

## 3. Authentication settings

In Authentication → URL Configuration:

- Set the Site URL to the deployed web app's URL.
- Allow `http://localhost:8081/` for local web development.
- Allow the deployed app's origin with a trailing slash.
- For native development/production builds, allow `vertigoes://auth/callback`.

Keep email confirmation enabled. Configure custom SMTP (for example Resend) before inviting
users; the default Supabase sender is limited to testing with your project team.
An email-confirmation signup displays a check-your-email message and does not claim to be
signed in. Password reset returns to the app and shows a new-password form.

Enable Google in Authentication → Sign In / Providers and supply its provider
credentials if you want those buttons to work. Provider credentials belong in Supabase, not
the app. Native OAuth needs a development/production build with the registered scheme;
use web for testing redirects rather than relying on Expo Go's changing development URL.

The web email forms support Cloudflare Turnstile for signup, login, and recovery requests.
Before enabling it in Supabase, set `EXPO_PUBLIC_TURNSTILE_SITE_KEY` in the app build and
configure the matching secret in Supabase. Native users are directed to the web app when
a challenge is required. Production email delivery,
redirect allowlists, and two-account tests still require dashboard setup and verification.

## 4. Review bug reports

Open Table Editor → `bug_reports`. Each report contains its text, submitting account ID,
platform, language, app version, creation time, and status.
Change status to `in_progress` or `resolved` in the dashboard.
Signed-in app users can submit and read only their own reports; they cannot change report
status or read another user's report. Reports do not automatically include medical answers,
chat transcripts, screenshots, passwords, or access tokens.

The menu button is visible to guests too; submitting requires email sign-in, with the draft
kept open beneath that screen. Failed submissions preserve text and reuse a report ID, so a
retry after a lost response does not create a duplicate.

## 5. Deploy account deletion

The Menu contains a permanent account-deletion flow. The authenticated client calls the
`delete-account` Edge Function; only that function receives Supabase's server-side service
role credential. Never add that credential to Render or to an `EXPO_PUBLIC_` variable.

With the Supabase CLI linked to the production project, deploy it with:

```sh
supabase db push
supabase secrets set ALLOWED_ORIGINS=https://app.vertigoes.co,https://vertigoes-app.onrender.com,http://localhost:8081
supabase functions deploy delete-account
```

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to its Edge Function environment. The origin allowlist must use
origins only—no path or trailing slash. Update it when the production/staging origins change.

Deleting an auth account cascades to its profile, medical answers, calendar records, and
private quota counters. Existing bug reports retain only operational metadata. Their account
link and user-written description are removed before deletion, and `anonymized_at` records
when that happened. Retained anonymous reports are not readable through the user API.

## 6. Verify after connecting

1. Sign up, confirm the email, sign in, reload, and check the account is restored.
2. Finish or skip onboarding; reload and verify the saved state.
3. Record sleep/feeling, reload, and verify the calendar entry.
4. Submit a bug, verify it in Table Editor, and check a second account cannot read it.
5. Delete a disposable account and confirm its Auth user, profile, and calendar rows disappear;
   confirm its bug-report row has `user_id = null`, scrubbed text, and `anonymized_at` set.
6. Test wrong credentials, password reset, sign-out, and temporary network loss.
7. Run `npm test`, `npm run typecheck`, and `npm run build:web`.

## Phone installation and hosting

Run `npm run build:web` and host the **contents of `dist`** at the root of an HTTPS
site or subdomain, such as `app.example.com`. Never upload the repository or `.env.local`.
The build includes a web manifest, home-screen icons, responsive phone sizing, and a
generic offline page. Only that offline page is cached: account features still need internet,
and this does not implement offline data entry/sync. Development builds do not register a
service worker.

On iPhone, open the hosted URL in Safari and use Share → Add to Home Screen.
On Android, open it in Chrome and use the menu's Install app / Add to Home screen option.
Keep the hosted origin in Supabase's Site URL and redirect allowlist for email-confirmation
and password-reset links. A custom domain requires its owner's approval and DNS configuration;
using a separate `app` subdomain does not require replacing the existing website.

Render hosts the app; verify its build, environment, and live URL when access is available.
The existing app icon is reused for installation. See [RELEASING.md](RELEASING.md) for separate
development/staging/production sites and databases, and manual production releases.

## Scope and remaining work

- Calendar saves have an error indicator and explicit retry. Pending saves are in memory:
  keep the app open and retry before reloading or signing out. This is not offline sync.
- Mock checkout is now disabled by default and always disabled in production. Only an explicit
  `EXPO_PUBLIC_ENABLE_DEMO_BILLING=true` in a development build permits the design demo; never
  enter real card details there. This is NOT a billing integration or server-side entitlement
  system. Real payments require a provider, verified webhooks, and backend permission checks.
- Liv, exercises, professionals, meditation, subscriptions, community, playlists, symptom
  summaries and diagnostic questions are in **To be announced**
  mode. Their old demo screens are not mounted, and Liv cannot reply or write summaries.
  Exercise-list customizations and chat threads still need persistence before being enabled.
- Emergency guided help is available to guests and signed-in users. Contact calling opens
  the dialer with the signed-in user's saved contact; missing contacts lead to profile setup.
  Opening the dialer does not record a completed phone call.
- Verify the Render deployment; offline sync and real billing/AI are separate next steps.
- Existing privacy/disclaimer links still point to placeholders. Supply the actual documents
  before public signup.
- The free Supabase project can pause when inactive. Choose a plan appropriate to availability
  and backup needs before launch.

Reference: [Expo 57](https://docs.expo.dev/versions/v57.0.0/),
[Supabase React Native auth](https://supabase.com/docs/guides/auth/quickstarts/react-native),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
