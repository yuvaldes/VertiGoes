// Run with Node 22.13+: node --experimental-strip-types --test src/lib/dayRecords.test.cjs
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createDayRecordsStore, createDayRecordsTransport, parseDayRecord } = require('./dayRecords.ts');

const date = '2026-09-24';
const emptyRecord = (date) => ({
  date, episodes: 0, emergencyCall: false, inAppHelp: null, sleepHours: null,
  feeling: null, exercisePlan: 'once', exercises: {}, liv: null,
});
const episode = (record) => ({ ...record, episodes: record.episodes + 1 });
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function cloudStore(transport) {
  return createDayRecordsStore({ initialRecords: new Map(), emptyRecord, transport });
}

test('guest seeds stay in their store; real accounts start empty and never upload on load', async () => {
  const guest = createDayRecordsStore({
    initialRecords: new Map([[date, { ...emptyRecord(date), episodes: 50 }]]),
    emptyRecord, transport: null,
  });
  guest.update(date, episode);
  const writes = [];
  const account = cloudStore({ load: async () => new Map(), save: async (r) => { writes.push(r); } });
  assert.equal(account.getSnapshot().records.size, 0);
  account.start();
  await tick();
  assert.equal(account.getSnapshot().records.size, 0);
  assert.deepEqual(writes, []);
  assert.equal(guest.getRecord(date).episodes, 51);
});

test('restoring auth cannot seed, edit, or save history', () => {
  const store = createDayRecordsStore({ initialRecords: new Map(), emptyRecord, transport: null, readOnly: true });
  store.update(date, episode);
  store.reset(new Map([[date, emptyRecord(date)]]));
  assert.equal(store.getSnapshot().records.size, 0);
  assert.equal(store.getSnapshot().syncStatus, 'loading');
});

test('edits during load are synchronous and replay on the cloud base without losing fields', async () => {
  const loading = deferred();
  const writes = [];
  const store = cloudStore({ load: () => loading.promise, save: async (r) => { writes.push(r); } });
  store.start();
  store.update(date, episode);
  store.update(date, (r) => ({ ...r, sleepHours: 8 }));
  assert.equal(store.getRecord(date).episodes, 1);
  assert.equal(store.getRecord(date).sleepHours, 8);
  assert.deepEqual(writes, []);
  loading.resolve(new Map([[date, { ...emptyRecord(date), episodes: 4, feeling: 'good' }]]));
  await tick();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].episodes, 5);
  assert.equal(writes[0].feeling, 'good');
  assert.equal(writes[0].sleepHours, 8);
  assert.equal(store.getSnapshot().syncStatus, 'saved');
});

test('failed initial load does not upload incomplete records; retry retains local edits', async () => {
  let fail = true;
  const writes = [];
  const store = cloudStore({
    load: async () => {
      if (fail) throw new Error('offline');
      return new Map([[date, { ...emptyRecord(date), episodes: 7 }]]);
    },
    save: async (r) => { writes.push(r); },
  });
  store.start();
  store.update(date, episode);
  await tick();
  assert.equal(store.getSnapshot().syncStatus, 'error');
  assert.deepEqual(writes, []);
  fail = false;
  store.retrySync();
  await tick();
  assert.equal(writes[0].episodes, 8);
  assert.equal(store.getSnapshot().syncStatus, 'saved');
});

test('writes serialize and acknowledge only the sent version; newer edits coalesce by day', async () => {
  const pending = [];
  const store = cloudStore({
    load: async () => new Map(),
    save: (r) => { const request = deferred(); pending.push({ record: r, ...request }); return request.promise; },
  });
  store.start();
  await tick();
  store.update(date, episode);
  store.update(date, episode);
  store.update(date, episode);
  store.update('2026-09-25', episode);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].record.episodes, 1);
  pending[0].resolve();
  await tick();
  assert.equal(pending.length, 2);
  assert.equal(pending[1].record.episodes, 3);
  assert.equal(store.getSnapshot().syncStatus, 'saving');
  pending[1].resolve();
  await tick();
  assert.equal(pending[2].record.date, '2026-09-25');
  pending[2].resolve();
  await tick();
  assert.equal(store.getSnapshot().syncStatus, 'saved');
});

test('a rejected save remains error after further edits; retry sends the latest snapshot', async () => {
  let fail = true;
  const writes = [];
  const store = cloudStore({ load: async () => new Map(), save: async (r) => {
    writes.push(r);
    if (fail) throw new Error('offline');
  } });
  store.start();
  await tick();
  store.update(date, episode);
  await tick();
  store.update(date, episode);
  await tick();
  assert.equal(store.getSnapshot().syncStatus, 'error');
  assert.equal(writes.length, 1);
  fail = false;
  store.retrySync();
  await tick();
  assert.equal(writes[1].episodes, 2);
  assert.equal(store.getSnapshot().syncStatus, 'saved');
});

test('stopped account ignores late loads and stale callbacks; its data is not readable', async () => {
  const loading = deferred();
  const writes = [];
  const first = cloudStore({ load: () => loading.promise, save: async (r) => { writes.push(r); } });
  first.start();
  first.update(date, episode);
  first.stop();
  const second = cloudStore({ load: async () => new Map(), save: async (r) => { writes.push(r); } });
  second.start();
  first.update(date, episode);
  first.retrySync();
  loading.resolve(new Map([[date, { ...emptyRecord(date), episodes: 99 }]]));
  await tick();
  assert.equal(first.getRecord(date), undefined);
  assert.equal(second.getSnapshot().records.size, 0);
  assert.deepEqual(writes, []);
});

test('sign-out stops the remaining queue after an already dispatched save settles', async () => {
  const saving = deferred();
  const writes = [];
  const store = cloudStore({ load: async () => new Map(), save: (r) => { writes.push(r); return saving.promise; } });
  store.start();
  await tick();
  store.update(date, episode);
  store.update(date, episode);
  store.stop();
  saving.resolve();
  await tick();
  assert.equal(writes.length, 1);
  assert.equal(store.getRecord(date), undefined);
});

test('Strict Mode stop/start ignores the first load and replays pending edits exactly once', async () => {
  const firstLoad = deferred();
  let loads = 0;
  const writes = [];
  const store = cloudStore({
    load: () => ++loads === 1 ? firstLoad.promise : Promise.resolve(new Map()),
    save: async (r) => { writes.push(r); },
  });
  store.start();
  store.update(date, episode);
  store.stop();
  store.start();
  firstLoad.resolve(new Map([[date, { ...emptyRecord(date), episodes: 99 }]]));
  await tick();
  assert.equal(loads, 2);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].episodes, 1);
});

// Small thenable Supabase boundary stub; the state machine above uses independent transports.
function clientStub(userId, dispatch) {
  const state = { userId };
  const client = {
    auth: { getSession: async () => ({ error: null, data: {
      session: state.userId ? { user: { id: state.userId }, access_token: `token-${state.userId}` } : null,
    } }) },
    from(table) {
      const request = { table, headers: {} };
      const query = {
        select(columns) { request.columns = columns; return query; },
        eq(column, value) { request.owner = [column, value]; return query; },
        order(column, options) { request.order = [column, options]; return query; },
        limit() { return query; },
        gt(column, value) { request.after = value; return query; },
        setHeader(name, value) { request.headers[name] = value; return query; },
        abortSignal(signal) { request.signal = signal; return query; },
        upsert(row, options) { request.row = row; request.options = options; return query; },
        then(resolve, reject) { return Promise.resolve().then(() => dispatch(request)).then(resolve, reject); },
      };
      return query;
    },
  };
  return { client, state };
}

test('transport scopes and orders reads, paginates, and validates JSONB ownership', async () => {
  const requests = [];
  const { client } = clientStub('reader', (request) => {
    requests.push(request);
    return { error: null, data: request.after ? [] : [
      { user_id: 'reader', record_date: date, record: emptyRecord(date) },
    ] };
  });
  const result = await createDayRecordsTransport(client, 'reader').load(new AbortController().signal);
  assert.equal(result.size, 1);
  assert.deepEqual(requests[0].owner, ['user_id', 'reader']);
  assert.deepEqual(requests[0].order, ['record_date', { ascending: true }]);
  assert.equal(requests[0].headers.Authorization, 'Bearer token-reader');
  assert.equal(requests[1].after, date);
  const wrongOwner = clientStub('reader', () => ({ error: null, data: [
    { user_id: 'other', record_date: date, record: emptyRecord(date) },
  ] })).client;
  await assert.rejects(createDayRecordsTransport(wrongOwner, 'reader').load(new AbortController().signal));
  assert.throws(() => parseDayRecord(date, { ...emptyRecord(date), date: '2026-09-23' }));
  assert.throws(() => parseDayRecord(date, { ...emptyRecord(date), inAppHelp: { answers: [null] } }));
});

test('transport rejects missing clients, wrong accounts, and database errors', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(createDayRecordsTransport(null, 'absent').load(signal));
  let requests = 0;
  const { client, state } = clientStub('other', () => { requests++; return { error: new Error('RLS rejected') }; });
  const transport = createDayRecordsTransport(client, 'owner');
  await assert.rejects(transport.save(emptyRecord(date), signal));
  assert.equal(requests, 0);
  state.userId = 'owner';
  await assert.rejects(transport.save(emptyRecord(date), signal));
  assert.equal(requests, 1);
});

test('transport serializes across provider instances and skips cancelled queued writes', async () => {
  const first = deferred();
  const requests = [];
  const { client } = clientStub('writer', (request) => {
    requests.push(request);
    return requests.length === 1 ? first.promise : { error: null };
  });
  const firstSignal = new AbortController();
  const cancelled = new AbortController();
  const transport = createDayRecordsTransport(client, 'writer');
  const write1 = transport.save(emptyRecord(date), firstSignal.signal);
  await tick();
  firstSignal.abort(); // Dispatched request still occupies its place in the queue.
  const write2 = transport.save({ ...emptyRecord(date), episodes: 1 }, cancelled.signal);
  const rejected = assert.rejects(write2);
  cancelled.abort();
  const write3 = createDayRecordsTransport(client, 'writer')
    .save({ ...emptyRecord(date), episodes: 2 }, new AbortController().signal);
  await tick();
  assert.equal(requests.length, 1);
  first.resolve({ error: null });
  await Promise.all([write1, rejected, write3]);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].row.record.episodes, 2);
  assert.equal(requests[1].row.user_id, 'writer');
  assert.equal(requests[1].row.record_date, date);
  assert.equal('updated_at' in requests[1].row, false);
  assert.equal(requests[1].options.onConflict, 'user_id,record_date');
});

test('returning to an account waits for its previous dispatched save before loading', async () => {
  const saving = deferred();
  let serverRecord = emptyRecord(date);
  let reads = 0;
  const { client } = clientStub('returning', async (request) => {
    if (request.row) {
      await saving.promise;
      serverRecord = request.row.record;
      return { error: null };
    }
    reads++;
    return { error: null, data: request.after ? [] : [
      { user_id: 'returning', record_date: date, record: serverRecord },
    ] };
  });
  const transport = createDayRecordsTransport(client, 'returning');
  const writing = transport.save({ ...emptyRecord(date), episodes: 3 }, new AbortController().signal);
  await tick();
  const loading = createDayRecordsTransport(client, 'returning').load(new AbortController().signal);
  await tick();
  assert.equal(reads, 0);
  saving.resolve();
  await writing;
  assert.equal((await loading).get(date).episodes, 3);
});

test('authenticated reset cannot seed demo data and does not delete remote history', async () => {
  const store = cloudStore({
    load: async () => new Map([[date, { ...emptyRecord(date), episodes: 2 }]]),
    save: async () => { assert.fail('reset must not upload anything'); },
  });
  store.start();
  await tick();
  store.reset(new Map([[date, { ...emptyRecord(date), episodes: 99 }]]));
  assert.equal(store.getSnapshot().records.size, 0);
  await tick();
  assert.equal(store.getRecord(date).episodes, 2);
});
