const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { PGlite } = require('@electric-sql/pglite');

const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const report = '33333333-3333-4333-8333-333333333333';

// Execute the actual migration in PostgreSQL, with Supabase's auth identity contract.
test('Supabase migration enforces account and bug-report isolation', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('${alice}'), ('${bob}');
  `);
  await db.exec(readFileSync(join(__dirname, 'migrations/202609240001_accounts_and_bug_reports.sql'), 'utf8'));

  const asUser = async (id) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  };

  await t.test('owners can create profiles and save calendar records', async () => {
    await asUser(alice);
    await db.query('insert into public.profiles (id) values ($1)', [alice]);
    await db.query("insert into public.day_records values ($1, '2026-09-24', $2, now())",
      [alice, JSON.stringify({ date: '2026-09-24', sleepHours: 8 })]);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
    await db.query("update public.profiles set onboarding_status = 'skipped', progress_step = 2 where id = $1", [alice]);
    assert.equal((await db.query('select onboarding_status from public.profiles')).rows[0].onboarding_status, 'skipped');
  });

  await t.test('another account cannot read, edit, or delete private data', async () => {
    await asUser(bob);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
    assert.equal((await db.query('select * from public.day_records')).rows.length, 0);
    assert.equal((await db.query("update public.profiles set progress_step = 3 returning id")).rows.length, 0);
    assert.equal((await db.query('delete from public.day_records returning user_id')).rows.length, 0);
    await assert.rejects(db.query('insert into public.profiles (id) values ($1)', [alice]), /row-level security/);
    await assert.rejects(db.query("insert into public.day_records values ($1, '2026-09-25', $2, now())",
      [alice, JSON.stringify({ date: '2026-09-25' })]), /row-level security/);
  });

  await t.test('clients cannot transfer ownership or mark incomplete answers complete', async () => {
    await asUser(alice);
    await assert.rejects(db.query('update public.profiles set id = $1', [bob]), /row-level security/);
    await assert.rejects(db.exec("update public.profiles set onboarding_status = 'complete'"), /check constraint/);
    await assert.rejects(db.exec("update public.day_records set record = '{}'::jsonb"), /check constraint/);
  });

  await t.test('reports default to new and are visible to their submitter only', async () => {
    await asUser(alice);
    await db.query(`insert into public.bug_reports
      (id, user_id, description, platform, locale, app_version) values ($1, $2, $3, 'web', 'he', '1.0.0')`,
      [report, alice, 'הכפתור לא עובד']);
    const own = (await db.query('select * from public.bug_reports')).rows;
    assert.equal(own.length, 1);
    assert.equal(own[0].status, 'new');
    assert.ok(own[0].created_at);
    await asUser(bob);
    assert.equal((await db.query('select * from public.bug_reports')).rows.length, 0);
    await assert.rejects(db.query(`insert into public.bug_reports
      (user_id, description, platform, locale, app_version) values ($1, 'spoofed', 'web', 'en', '1.0.0')`, [alice]),
      /row-level security/);
  });

  await t.test('empty and oversized reports are rejected by the database', async () => {
    await asUser(alice);
    for (const text of ['   ', '\n\t\r', 'x'.repeat(3001)]) {
      await assert.rejects(db.query(`insert into public.bug_reports
        (user_id, description, platform, locale, app_version) values ($1, $2, 'web', 'en', '1.0.0')`,
        [alice, text]), /check constraint/);
    }
  });

  await t.test('reports cannot be edited, deleted, or assigned a status by app clients', async () => {
    await asUser(alice);
    await assert.rejects(db.exec("update public.bug_reports set status = 'resolved'"), /permission denied/);
    await assert.rejects(db.exec('delete from public.bug_reports'), /permission denied/);
    await assert.rejects(db.query(`insert into public.bug_reports
      (user_id, description, platform, locale, app_version, status)
      values ($1, 'test', 'web', 'en', '1.0.0', 'resolved')`, [alice]), /permission denied/);
  });

  await t.test('anonymous clients have no table access', async () => {
    await db.exec('reset role; set role anon');
    for (const table of ['profiles', 'day_records', 'bug_reports']) {
      await assert.rejects(db.exec('select * from public.' + table), /permission denied/);
    }
    await assert.rejects(db.query(`insert into public.bug_reports
      (user_id, description, platform, locale, app_version) values ($1, 'anonymous', 'web', 'en', '1.0.0')`, [alice]),
      /permission denied/);
  });

  await t.test('administrators can review and resolve reports', async () => {
    await db.exec('reset role; set role service_role');
    assert.equal((await db.query('select * from public.bug_reports')).rows.length, 1);
    await db.query("update public.bug_reports set status = 'resolved' where id = $1", [report]);
    assert.equal((await db.query('select status from public.bug_reports')).rows[0].status, 'resolved');
  });
});
