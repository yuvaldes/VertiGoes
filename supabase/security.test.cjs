const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { PGlite } = require('@electric-sql/pglite');

const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const profile = {
  firstName: '', lastName: '', age: '42', gender: null, language: 'en',
  diagnosedBefore: null, diagnoses: [], otherDiagnosis: '', medications: [], otherMedication: '',
  diagnosisAnswers: {}, manualDiagnosis: '', emergencyContactName: '', emergencyContactPhone: '',
};
const record = {
  date: '2026-09-24', episodes: 0, emergencyCall: false, inAppHelp: null,
  sleepHours: null, feeling: null, exercisePlan: 'once', exercises: {}, liv: null,
};

test('security hardening validates input and enforces private atomic quotas', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key, created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('${alice}'), ('${bob}');`);
  const migrationDir = path.join(__dirname, 'migrations');
  for (const name of readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(path.join(migrationDir, name), 'utf8'));
  }
  const asUser = async (id = alice) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  };
  const clearCounters = async () => {
    await db.exec('reset role; delete from vertigoes_private.write_limits');
    await asUser();
  };
  const saveProfile = (answers) => db.query(`insert into public.profiles(id,onboarding_status,answers)
    values($1,'complete',$2) on conflict(id) do update set onboarding_status='complete', answers=excluded.answers`,
    [alice, JSON.stringify(answers)]);
  const saveRecord = (value) => db.query(`insert into public.day_records(user_id,record_date,record)
    values($1,'2026-09-24',$2) on conflict(user_id,record_date) do update set record=excluded.record`,
    [alice, JSON.stringify(value)]);
  const report = () => db.query(`insert into public.bug_reports(user_id,description,platform,locale,app_version)
    values($1,'Local security test','web','en','1.0.0')`, [alice]);

  await t.test('real app-shaped onboarding and calendar data are accepted', async () => {
    await asUser();
    await saveProfile(profile);
    await saveRecord(record);
    await saveRecord({ ...record, sleepHours: 7.5, feeling: 'good', episodes: 2,
      exercises: { morning: { done: 2, total: 3 } }, liv: { summary: 'סיכום' },
      inAppHelp: { answers: [{ questionId: 'Q0.1', optionIndex: 1 }] } });
  });

  const invalidProfiles = [
    {}, null, [], { ...profile, age: '' }, { ...profile, age: '0' }, { ...profile, age: '131' },
    { ...profile, age: 42 }, { ...profile, age: '2.5' }, { ...profile, age: 'abc' },
    { ...profile, gender: 'unknown' }, { ...profile, language: null },
    { ...profile, firstName: null }, { ...profile, firstName: 'x'.repeat(101) },
    { ...profile, diagnosedBefore: 'yes' }, { ...profile, diagnoses: ['unknown'] },
    { ...profile, diagnoses: ['none', 'bppv'] }, { ...profile, diagnoses: ['bppv', 'bppv'] },
    { ...profile, medications: [42] }, { ...profile, medications: ['unrecognised'] },
    { ...profile, diagnosisAnswers: { q: 'yes' } }, { ...profile, manualDiagnosis: 'x'.repeat(2001) },
    { ...profile, emergencyContactPhone: 'x'.repeat(41) }, { ...profile, extra: 'not allowed' },
  ];
  await t.test('malformed and oversized profile answers are rejected at the database', async () => {
    await clearCounters();
    for (const value of invalidProfiles) {
      await assert.rejects(saveProfile(value), error => error.code === '22023' || error.code === '23514');
    }
    assert.equal((await db.query('select answers from public.profiles where id=$1', [alice])).rows[0].answers.age, '42');
  });

  await t.test('all required profile keys reject omission and invalid JSON types', async () => {
    for (const key of Object.keys(profile)) {
      const missing = { ...profile }; delete missing[key];
      await assert.rejects(saveProfile(missing), error => error.code === '22023');
      await assert.rejects(saveProfile({ ...profile, [key]: 12345 }), error => error.code === '22023');
    }
  });

  const invalidRecords = [
    {}, null, [], { ...record, date: '2026-09-25' }, { ...record, episodes: -1 },
    { ...record, episodes: 1.2 }, { ...record, episodes: 1001 }, { ...record, episodes: '2' },
    { ...record, sleepHours: -1 }, { ...record, sleepHours: 25 }, { ...record, sleepHours: '8' },
    { ...record, emergencyCall: 'false' }, { ...record, feeling: 'great' },
    { ...record, exercisePlan: 'invalid' }, { ...record, exercises: [] },
    { ...record, exercises: { unknown: { done: 1, total: 2 } } },
    { ...record, exercises: { morning: { done: 4, total: 3 } } },
    { ...record, exercises: { morning: { done: 1.5, total: 3 } } },
    { ...record, exercises: { morning: { total: 3 } } },
    { ...record, exercises: { morning: { done: 1, total: 3, extra: true } } },
    { ...record, liv: {} }, { ...record, liv: { summary: 'x'.repeat(4001) } },
    { ...record, inAppHelp: {} }, { ...record, inAppHelp: { answers: [{ questionId: 'Q0.1', optionIndex: -1 }] } },
    { ...record, inAppHelp: { answers: [{ questionId: 'Q0.1', optionIndex: 0.5 }] } },
    { ...record, inAppHelp: { answers: Array.from({ length: 65 }, () => ({ questionId: 'Q1', optionIndex: 0 })) } },
    { ...record, extra: 'not allowed' },
  ];
  await t.test('malformed calendar data is rejected even when bypassing the app', async () => {
    for (const value of invalidRecords) {
      await assert.rejects(saveRecord(value), error => ['22023','23502'].includes(error.code));
    }
    for (const key of Object.keys(record)) {
      const missing = { ...record }; delete missing[key];
      await assert.rejects(saveRecord(missing), error => error.code === '22023');
    }
  });

  await t.test('RLS and restricted bug-report columns remain enforced after hardening', async () => {
    await asUser(bob);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
    assert.equal((await db.query('select * from public.day_records')).rows.length, 0);
    assert.equal((await db.query('update public.day_records set record=record returning user_id')).rows.length, 0);
    assert.equal((await db.query('delete from public.profiles returning id')).rows.length, 0);
    await assert.rejects(saveProfile(profile), error => error.code === '42501');
    await assert.rejects(saveRecord(record), error => error.code === '42501');
    await assert.rejects(report(), error => error.code === '42501');
    await asUser();
    await assert.rejects(db.query('update public.profiles set id=$1', [bob]), error => error.code === '42501');
    await assert.rejects(db.exec("update public.bug_reports set status='resolved'"), error => error.code === '42501');
    await assert.rejects(db.exec('delete from public.bug_reports'), error => error.code === '42501');
  });

  await t.test('six-report batch is rejected atomically with no partial reports or quota consumption', async () => {
    await clearCounters();
    await assert.rejects(db.query(`insert into public.bug_reports(user_id,description,platform,locale,app_version)
      select $1,'Batch','web','en','1.0.0' from generate_series(1,6)`, [alice]), error => error.code === 'PT429');
    assert.equal((await db.query('select * from public.bug_reports')).rows.length, 0);
    await db.exec('reset role');
    assert.equal((await db.query('select * from vertigoes_private.write_limits')).rows.length, 0);
    await asUser();
  });

  await t.test('five reports per hour are allowed; the sixth is rejected', async () => {
    for (let i = 0; i < 5; i++) await report();
    await assert.rejects(report(), error => error.code === 'PT429');
    assert.equal((await db.query('select * from public.bug_reports')).rows.length, 5);
  });

  await t.test('report retries keep their ID and do not consume another quota slot', async () => {
    const saved = (await db.query('select * from public.bug_reports limit 1')).rows[0];
    await assert.rejects(db.query(`insert into public.bug_reports(id,user_id,description,platform,locale,app_version)
      values($1,$2,'Local security test','web','en','1.0.0')`, [saved.id, alice]), error => error.code === '23505');
    await db.exec('reset role');
    assert.equal((await db.query("select short_count from vertigoes_private.write_limits where resource='bug_reports'")).rows[0].short_count, 5);
    await asUser();
  });

  await t.test('daily report quota persists across hourly windows and cannot be reset by profile deletion', async () => {
    await db.exec(`reset role; update vertigoes_private.write_limits set
      short_window=short_window-interval '1 hour', day_count=20 where resource='bug_reports'`);
    await asUser();
    await db.query('delete from public.profiles where id=$1', [alice]);
    await saveProfile(profile);
    await assert.rejects(report(), error => error.code === 'PT429');
  });

  await t.test('UTC counters cannot be bypassed by changing the session timezone', async () => {
    await db.exec("set timezone='Pacific/Honolulu'");
    await assert.rejects(report(), error => error.code === 'PT429');
    await db.exec("set timezone='UTC'");
  });

  await t.test('a new UTC day replenishes both quotas', async () => {
    await db.exec(`reset role; update vertigoes_private.write_limits set
      short_window=short_window-interval '1 day', day_window=day_window-1 where resource='bug_reports'`);
    await asUser();
    await report();
  });

  await t.test('profile upserts count once, and the 21st write is blocked', async () => {
    await clearCounters();
    for (let i = 0; i < 20; i++) await saveProfile(profile);
    await assert.rejects(saveProfile(profile), error => error.code === 'PT429');
  });

  await t.test('an older statement cannot rewind a newer quota window', async () => {
    await clearCounters();
    await report();
    // Model a newer request acquiring the counter lock before an older statement.
    await db.exec(`reset role; update vertigoes_private.write_limits set
      short_window=short_window+interval '1 day', day_window=day_window+1,
      short_count=4, day_count=19 where resource='bug_reports'`);
    const before = (await db.query("select * from vertigoes_private.write_limits where resource='bug_reports'")).rows[0];
    await asUser();
    await report();
    await assert.rejects(report(), error => error.code === 'PT429');
    await db.exec('reset role');
    const after = (await db.query("select * from vertigoes_private.write_limits where resource='bug_reports'")).rows[0];
    assert.equal(after.short_window.getTime(), before.short_window.getTime());
    assert.equal(after.day_window.getTime(), before.day_window.getTime());
    assert.equal(after.short_count, 5);
    assert.equal(after.day_count, 20);
    await asUser();
  });

  await t.test('calendar writes stop at the minute and day quotas', async () => {
    await clearCounters();
    await saveRecord(record);
    await db.exec("reset role; update vertigoes_private.write_limits set short_count=120 where resource='day_records'");
    await asUser();
    await assert.rejects(saveRecord(record), error => error.code === 'PT429');
    await db.exec(`reset role; update vertigoes_private.write_limits set
      short_window=short_window-interval '1 minute', day_count=1000 where resource='day_records'`);
    await asUser();
    await assert.rejects(saveRecord(record), error => error.code === 'PT429');
  });

  await t.test('different users have independent quotas', async () => {
    await asUser(bob);
    await db.query(`insert into public.bug_reports(user_id,description,platform,locale,app_version)
      values($1,'Bob report','web','en','1.0.0')`, [bob]);
    assert.equal((await db.query('select * from public.bug_reports')).rows.length, 1);
  });

  await t.test('client roles cannot read, reset, or invoke private quota internals', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`reset role; set role ${role}`);
      for (const sql of ['select * from vertigoes_private.write_limits',
        'delete from vertigoes_private.write_limits', 'select vertigoes_private.enforce_write_limit()']) {
        await assert.rejects(db.exec(sql), error => error.code === '42501');
      }
    }
    await db.exec('reset role; set role anon');
    for (const table of ['profiles','day_records','bug_reports']) {
      await assert.rejects(db.query('select * from public.' + table), error => error.code === '42501');
    }
  });

  await t.test('the live two-account audit passes without exposing or changing private data', async () => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.query(`insert into public.profiles(id,onboarding_status,answers)
      values($1,'complete',$2) on conflict(id) do update set answers=excluded.answers`,
      [bob, JSON.stringify(profile)]);
    await db.query(`insert into public.day_records(user_id,record_date,record)
      values($1,'2026-09-24',$2) on conflict(user_id,record_date) do update set record=excluded.record`,
      [bob, JSON.stringify(record)]);
    const output = await db.exec(readFileSync(path.join(__dirname, 'verify_two_account_rls.sql'), 'utf8'));
    const report = output.find(result => result.rows?.some(row => row.check_name === 'OVERALL'));
    const overall = report.rows.find(row => row.check_name === 'OVERALL');
    assert.equal(overall.result, 'PASS');
    assert.equal(overall.detail, '19/19 checks passed');
    assert.equal((await db.query("select * from public.day_records where record_date='2099-12-31'")).rows.length, 0);
  });

  await t.test('account deletion erases health data and anonymizes retained bug metadata', async () => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.query(`insert into public.profiles(id,onboarding_status,answers)
      values($1,'complete',$2) on conflict(id) do update set answers=excluded.answers`,
      [alice, JSON.stringify(profile)]);
    await db.query(`insert into public.day_records(user_id,record_date,record)
      values($1,'2026-09-24',$2) on conflict(user_id,record_date) do update set record=excluded.record`,
      [alice, JSON.stringify(record)]);
    await db.query(`insert into public.bug_reports(user_id,description,platform,locale,app_version)
      values($1,'Contains private details','web','en','1.0.0')`, [alice]);
    await db.query('delete from auth.users where id=$1', [alice]);

    assert.equal((await db.query('select * from public.profiles where id=$1', [alice])).rows.length, 0);
    assert.equal((await db.query('select * from public.day_records where user_id=$1', [alice])).rows.length, 0);
    assert.equal((await db.query('select * from vertigoes_private.write_limits where user_id=$1', [alice])).rows.length, 0);
    const retained = (await db.query(
      "select * from public.bug_reports where description='[removed when account was deleted]'",
    )).rows;
    assert.ok(retained.length >= 1);
    assert.ok(retained.every(row => row.user_id === null && row.anonymized_at !== null));

    await asUser(bob);
    assert.equal((await db.query(
      "select * from public.bug_reports where description='[removed when account was deleted]'",
    )).rows.length, 0, 'another user cannot read retained anonymous reports');
  });

  await t.test('the read-only dashboard verification script confirms the expected configuration', async () => {
    await db.exec('reset role');
    const results = await db.exec(readFileSync(path.join(__dirname, 'verify_security.sql'), 'utf8'));
    const [tables, policies, anonymousGrants, reportGrants, triggers, privateGrants, legacyRows] = results;
    assert.equal(tables.rows.length, 3);
    assert.ok(tables.rows.every(row => row.rls_enabled === true));
    assert.ok(policies.rows.length >= 4);
    assert.ok(anonymousGrants.rows.every(({ table_name, ...grants }) => Object.values(grants).every(value => value === false)));
    assert.ok(Object.values(reportGrants.rows[0]).every(value => value === false));
    assert.equal(triggers.rows.length, 5);
    assert.ok(triggers.rows.every(row => row.enabled === 'O'));
    assert.ok(Object.values(privateGrants.rows[0]).every(value => value === false));
    assert.ok(legacyRows.rows.every(row => Number(row.legacy_invalid_rows) === 0));
  });
});
