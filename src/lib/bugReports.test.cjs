// Run: node --test src/lib/bugReports.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const filename = path.join(__dirname, 'bugReports.ts');
const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: filename,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

// Each test gets a fresh module and client. Never load the real client or native imports.
function loadHelper(supabase) {
  const module = { exports: {} };
  const mockRequire = (specifier) => {
    assert.equal(specifier, './supabase', 'Unexpected production dependency');
    return { supabase };
  };
  new Function('require', 'module', 'exports', outputText)(mockRequire, module, module.exports);
  return module.exports;
}

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const input = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  description: 'The calendar does not open.',
  platform: 'ios',
  locale: 'en',
  appVersion: '1.0.0',
};
const duplicate = { code: '23505', message: 'duplicate key' };
const matchingRow = { id: input.id, user_id: userId, description: input.description };

function harness(options = {}) {
  const calls = [];
  const client = {
    auth: {
      async getUser() {
        calls.push(['getUser']);
        if (options.authRejection) throw options.authRejection;
        return {
          data: { user: options.guest ? null : { id: userId } },
          error: options.authError ?? null,
        };
      },
    },
    from(table) {
      calls.push(['from', table]);
      assert.equal(table, 'bug_reports');
      return {
        async insert(row) {
          calls.push(['insert', row]);
          if (options.insertRejection) throw options.insertRejection;
          return { error: options.insertError ?? null };
        },
        select(columns) {
          calls.push(['select', columns]);
          const filters = [];
          const query = {
            eq(column, value) {
              filters.push([column, value]);
              calls.push(['eq', column, value]);
              return query;
            },
            async maybeSingle() {
              calls.push(['maybeSingle']);
              if (options.readRejection) throw options.readRejection;
              // Honour the actual query predicates, so dropping either ownership or ID
              // filtering would incorrectly accept a collision in the rejection tests.
              const row = (options.rows ?? []).find((candidate) =>
                filters.every(([column, value]) => candidate[column] === value));
              return {
                data: row ? { id: row.id, description: row.description } : null,
                error: options.readError ?? null,
              };
            },
          };
          return query;
        },
      };
    },
  };
  return { ...loadHelper(client), calls };
}

test('valid text is trimmed; the inserted owner comes from getUser, not caller input', async () => {
  const { submitBugReport, calls } = harness();
  await submitBugReport({ ...input, description: ` \n${input.description}\t `, user_id: otherUserId });
  assert.deepEqual(calls, [
    ['getUser'],
    ['from', 'bug_reports'],
    ['insert', {
      id: input.id, user_id: userId, description: input.description,
      platform: input.platform, locale: input.locale, app_version: input.appVersion,
    }],
  ]);
});

test('exact maximum length is accepted after trimming', async () => {
  const { submitBugReport, BUG_REPORT_MAX_LENGTH, calls } = harness();
  assert.equal(BUG_REPORT_MAX_LENGTH, 3000);
  const description = 'a'.repeat(BUG_REPORT_MAX_LENGTH);
  await submitBugReport({ ...input, description: `  ${description}\n` });
  assert.equal(calls.find(([name]) => name === 'insert')[1].description, description);
});

for (const [label, description] of [
  ['empty', ''],
  ['whitespace-only', ' \n\t '],
  ['too long', 'a'.repeat(3001)],
]) {
  test(`${label} text is rejected before any auth or database call`, async () => {
    const { submitBugReport, calls } = harness();
    await assert.rejects(submitBugReport({ ...input, description }), /Invalid report length/);
    assert.deepEqual(calls, []);
  });
}

test('a missing client rejects valid reports and still validates text first', async () => {
  const { submitBugReport } = loadHelper(null);
  await assert.rejects(submitBugReport(input), /Reports unavailable/);
  await assert.rejects(submitBugReport({ ...input, description: ' ' }), /Invalid report length/);
});

for (const [label, options] of [
  ['guest', { guest: true }],
  ['getUser error, even with a returned user', { authError: new Error('expired session') }],
]) {
  test(`${label} is rejected before any database call`, async () => {
    const { submitBugReport, calls } = harness(options);
    await assert.rejects(submitBugReport(input), /Sign in required/);
    assert.deepEqual(calls, [['getUser']]);
  });
}

test('getUser promise rejection propagates without making a database call', async () => {
  const error = new Error('auth network failure');
  const { submitBugReport, calls } = harness({ authRejection: error });
  await assert.rejects(submitBugReport(input), (actual) => actual === error);
  assert.deepEqual(calls, [['getUser']]);
});

for (const [label, options, error] of [
  ['returned insert error', { insertError: { code: '42501', message: 'RLS rejected' } }],
  ['insert promise rejection', { insertRejection: new Error('insert network failure') }],
].map(([label, options]) => [label, options, options.insertError ?? options.insertRejection])) {
  test(`${label} propagates unchanged without a duplicate lookup`, async () => {
    const { submitBugReport, calls } = harness(options);
    await assert.rejects(submitBugReport(input), (actual) => actual === error);
    assert.deepEqual(calls.map(([name]) => name), ['getUser', 'from', 'insert']);
  });
}

test('duplicate ID succeeds only after reading this user\'s matching ID and trimmed description', async () => {
  const { submitBugReport, calls } = harness({ insertError: duplicate, rows: [matchingRow] });
  await submitBugReport({ ...input, description: ` \n${input.description}\t` });
  assert.deepEqual(calls.slice(3), [
    ['from', 'bug_reports'],
    ['select', 'id, description'],
    ['eq', 'id', input.id],
    ['eq', 'user_id', userId],
    ['maybeSingle'],
  ]);
  assert.equal(calls.filter(([name]) => name === 'insert').length, 1);
});

for (const [label, options] of [
  ['no visible row', {}],
  ['a different owner with the same ID and description', { rows: [{ ...matchingRow, user_id: otherUserId }] }],
  ['a different ID with the same owner and description', { rows: [{ ...matchingRow, id: 'another-report' }] }],
  ['a different description with the same ID and owner', { rows: [{ ...matchingRow, description: 'Different report' }] }],
  ['a failed read even with matching data', { rows: [matchingRow], readError: new Error('read denied') }],
]) {
  test(`duplicate ID with ${label} preserves the original insert failure`, async () => {
    const { submitBugReport, calls } = harness({ insertError: duplicate, ...options });
    await assert.rejects(submitBugReport(input), (actual) => actual === duplicate);
    assert.equal(calls.filter(([name]) => name === 'maybeSingle').length, 1);
  });
}

test('a rejected duplicate lookup cannot be reported as success', async () => {
  const error = new Error('read network failure');
  const { submitBugReport } = harness({ insertError: duplicate, readRejection: error });
  await assert.rejects(submitBugReport(input), (actual) => actual === error);
});
