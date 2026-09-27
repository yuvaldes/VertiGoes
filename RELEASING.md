# Develop without changing production

Render hosts the app (reported by the project owner). Its linked branch, deploy settings,
live commit, and environment variables have not yet been inspected. No live settings were
changed by this work. **Do not push to its linked branch until those settings are confirmed.**
Local code edits and local builds do not deploy themselves. However, running the app with
production Supabase configuration can still read/write production data.

## One-time setup, when Render access is available

1. Record the current production URL, Git branch, and deployed commit in Render.
2. For the production site, open **Settings → Auto-Deploy → Off**. This makes releases manual.
   Check that no separate CI job or deploy hook publishes automatically either.
3. Keep production on a dedicated protected branch (for example `main`, after confirming the
   existing setup). Require reviewed pull requests and passing tests; avoid direct pushes.
4. Create a **separate Render static site** for staging, linked to a `staging` branch and its
   own URL. Enable automatic deploys there if desired. Use these build settings:
   - Build command: `npm ci && npm run typecheck && npm test && npm run build:web`
   - Publish directory: `dist`
5. Create a separate **Supabase test project**, or use local Supabase. Apply migrations there
   first. Use invented test data, never a copy of patients' production data.
6. Configure local development and staging with the **test project's** URL and publishable
   key. Configure only the production Render site with the production project values. Do not
   share a Render environment group containing production credentials with staging.
7. Set each Supabase project's email/OAuth redirect allowlist to its corresponding app URLs.
   Rebuild after changing `EXPO_PUBLIC_*` values: they are embedded in the exported app.

Even public Supabase keys identify a real backend. A different Git branch or staging URL does
**not** isolate data when both builds point to the same Supabase project. RLS isolates users,
not development from production. Never put server secrets/service-role keys in a web build.

## Normal development

1. Work on a feature branch, named for example `codex/exercise-videos`, using the test backend.
   Preserve and commit current work before switching branches; do not discard the worktree.
2. Implement the feature and its tests without changing production configuration.
3. Run `npm test`, `npm run typecheck`, and `npm run build:web`.
4. Merge the reviewed change into staging and test it on a phone, in English and Hebrew,
   including reloads, sign-out, error cases, and two-account isolation.
5. Keep unfinished features marked **To be announced** until they are actually ready.

## Intentional production release

1. Review the staged changes and select a tested commit for release.
2. Apply reviewed, backwards-compatible database migrations to production deliberately, after
   checking backups. Do not run production migrations automatically from a development build.
3. Merge the approved code into the production branch and manually deploy the tested commit
   from Render. Keep Auto-Deploy off if explicit approval is desired for each release.
4. Verify login, calendar saving, bug reporting, and PWA loading on the live URL.
5. Keep the previous good commit for rollback. Reverting the site does **not** undo database
   migrations, so schema changes must remain compatible with the previous app version.

## Content/service release checklist

`src/lib/featureAvailability.ts` is the central release checklist. These are UI switches,
not backend security permissions. No unfinished feature is enabled merely by making a build.

| Feature | Required before enabling |
| --- | --- |
| Liv / voice | Real server-side AI integration, privacy review, usage limits, safety tests; replace scripted replies and simulated speech |
| Professionals | Approved real profiles/contact details and working destination actions |
| Exercises | Supplied videos, player, accurate completion tracking and saved progress; replace tap-to-complete demo |
| Meditation | Supplied/licensed audio, working player and session behavior |
| Playlists / community / symptoms | Actual content/destinations and tested permissions/persistence where applicable |
| Subscription | Real billing provider, verified webhooks and backend entitlements; no mock checkout |
| Guided help / diagnostic questions | Approved question set, clinically reviewed guidance and tested recording |
| Contact calling | Use the user's saved contact, real phone behavior, no sample numbers or false call records |
| Google sign-in | Provider configuration, redirect allowlists, successful staging sign-in tests; Apple sign-in is removed |

Existing privacy/disclaimer destinations also show **To be announced**. That is not a
published policy or a substitute for valid consent; approved documents and consent handling
remain a public-launch requirement. Old demo/source files are retained for later implementation.

When adding content, replace the demo implementation **before** enabling its switch; a switch
alone does not make that feature functional. Update the associated release tests deliberately.

References: [Render deployment controls](https://render.com/docs/deploys),
[Supabase environments](https://supabase.com/docs/guides/deployment/managing-environments).
