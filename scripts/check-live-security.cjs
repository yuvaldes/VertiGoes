// Read-only public checks. Never prints keys, tokens, user data, or response bodies.
// Run: node --env-file=.env.local scripts/check-live-security.cjs
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key || !/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)) {
  console.error('Set the app Supabase URL and publishable key locally before running this check.');
  process.exit(1);
}
if (key.startsWith('sb_secret_')) throw new Error('Use a public app key, never an admin key.');
if (key.startsWith('eyJ')) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('Only a legacy anon key is accepted.');
}
const headers = { apikey: key };
async function check(endpoint, extraHeaders = {}) {
  const response = await fetch(new URL(endpoint, url), {
    headers: { ...headers, ...extraHeaders }, signal: AbortSignal.timeout(12000), redirect: 'error',
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}
(async () => {
  const settings = await check('/auth/v1/settings');
  console.log(JSON.stringify({ check: 'public_auth_settings', status: settings.status,
    emailEnabled: settings.data.external?.email, googleEnabled: settings.data.external?.google,
    appleEnabled: settings.data.external?.apple, signupsDisabled: settings.data.disable_signup,
    emailAutoconfirm: settings.data.mailer_autoconfirm,
    anonymousSigninsEnabled: settings.data.external?.anonymous_users }));
  let reviewRequired = settings.status !== 200;
  for (const table of ['profiles', 'day_records', 'bug_reports']) {
    const result = await check(`/rest/v1/${table}?select=*&limit=0`);
    const denied = [401, 403].includes(result.status) && result.data.code === '42501';
    reviewRequired ||= !denied;
    console.log(JSON.stringify({ check: 'anonymous_table_access', table, status: result.status,
      deniedAsExpected: denied }));
  }
  const forged = await check('/rest/v1/profiles?select=id&limit=0', { Authorization: 'Bearer invalid-test-token' });
  const rejected = [401, 403].includes(forged.status);
  reviewRequired ||= !rejected;
  console.log(JSON.stringify({ check: 'invalid_jwt', status: forged.status, rejected }));
  console.log('NOT VERIFIED: signed-in user isolation, deployed policies/triggers, SMTP, CAPTCHA, backups, or Render headers.');
  process.exitCode = reviewRequired ? 2 : 0;
})().catch(() => { console.error('Live check failed: network/configuration error. No secrets logged.'); process.exitCode = 1; });
