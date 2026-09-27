const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function harness(t, available = true) {
  const replies = [], summaries = [], writes = [];
  let id = 0, current, renderer;
  const day = { todayKey: '2026-09-24', getRecord: () => undefined,
    recordExerciseSlot() {}, recordLivSummary: (date, summary) => writes.push({ date, summary }) };
  const deps = {
    '../lib/featureAvailability': { isFeatureReady: () => available },
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../ai/mockLivProvider': { mockLivProvider: {
      reply: () => { const request = deferred(); replies.push(request); return request.promise; },
      summarize: () => { const request = deferred(); summaries.push(request); return request.promise; },
    } },
    '../data/dayRecords': { SLOT_ORDER: ['morning', 'midday', 'evening'] },
    '../data/helpFlow': { describeHelpSession: () => '' },
    '../data/livChat': { makeMessage: (role, text, rest) => ({ id: String(++id), role, text, ...rest }) },
    '../i18n': { useLocale: () => 'en' }, './DayRecordsContext': { useDayRecords: () => day },
  };
  const filename = path.join(__dirname, 'LivChatContext.tsx');
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(deps, name), name); return deps[name];
  }, mod, mod.exports);
  function Probe() { current = mod.exports.useLivChat(); return null; }
  await act(async () => { renderer = create(React.createElement(mod.exports.LivChatProvider, null, React.createElement(Probe))); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  return { get value() { return current; }, replies, summaries, writes, unmount: () => renderer.unmount() };
}

test('unannounced Liv cannot reply, summarize, or write activity', async t => {
  const h = await harness(t, false);
  await act(async () => {
    h.value.send('hello');
    await h.value.refreshDaySummary('2026-09-24');
    h.value.acceptAction('anything');
  });
  assert.equal(h.replies.length, 0);
  assert.equal(h.summaries.length, 0);
  assert.equal(h.writes.length, 0);
  assert.equal(h.value.todayMessages.length, 0);
  assert.equal(h.value.isThinking, false);
});

for (const rejected of [false, true]) {
  test(`account reset ignores a previous reply's ${rejected ? 'failure' : 'success'} and keeps the new request busy`, async t => {
    const h = await harness(t);
    await act(async () => { h.value.send('old account'); });
    await act(async () => { h.value.reset(); });
    await act(async () => { h.value.send('new account'); });
    await act(async () => {
      if (rejected) h.replies[0].reject(new Error('old failure'));
      else h.replies[0].resolve({ text: 'old reply' });
    });
    assert.deepEqual(h.value.todayMessages.map(m => m.text), ['new account']);
    assert.equal(h.value.isThinking, true);
    assert.equal(h.summaries.length, 0);
    await act(async () => { h.replies[1].resolve({ text: 'new reply' }); });
    assert.deepEqual(h.value.todayMessages.map(m => m.text), ['new account', 'new reply']);
    assert.equal(h.value.isThinking, false);
  });
}

test('a previous account summary cannot write after reset', async t => {
  const h = await harness(t);
  let work;
  await act(async () => { work = h.value.refreshDaySummary('2026-09-24'); });
  await act(async () => { h.value.reset(); });
  await act(async () => { h.summaries[0].resolve('private old summary'); await work; });
  assert.deepEqual(h.writes, []);
});

test('only the newest summary for a date can save', async t => {
  const h = await harness(t);
  let first, second;
  await act(async () => {
    first = h.value.refreshDaySummary('2026-09-24');
    second = h.value.refreshDaySummary('2026-09-24');
  });
  await act(async () => { h.summaries[1].resolve('latest'); await second; });
  await act(async () => { h.summaries[0].resolve('outdated'); await first; });
  assert.deepEqual(h.writes, [{ date: '2026-09-24', summary: 'latest' }]);
});

test('double taps cannot start parallel replies', async t => {
  const h = await harness(t);
  await act(async () => { h.value.send('first'); h.value.send('second'); });
  assert.equal(h.replies.length, 1);
  assert.deepEqual(h.value.todayMessages.map(m => m.text), ['first']);
});

test('unmount invalidates outstanding replies', async t => {
  const h = await harness(t);
  await act(async () => { h.value.send('old'); });
  await act(async () => { h.unmount(); });
  await act(async () => { h.replies[0].resolve({ text: 'old reply' }); });
  assert.equal(h.summaries.length, 0);
});

test('summary failure preserves stored history', async t => {
  const h = await harness(t);
  const work = h.value.refreshDaySummary('2026-09-24');
  h.summaries[0].reject(new Error('offline'));
  await work;
  assert.deepEqual(h.writes, []);
});
