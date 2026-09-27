const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function load(relative, dependencies, dev = false, flag) {
  const filename = path.resolve(__dirname, relative);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', 'process', compiled)(name => {
    assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name];
  }, mod, mod.exports, dev, { env: { EXPO_PUBLIC_ENABLE_DEMO_BILLING: flag } });
  return mod.exports;
}

test('demo billing requires explicit opt-in and can never be enabled in production', () => {
  for (const dev of [false, true]) for (const flag of [undefined, 'false', 'true']) {
    assert.equal(load('../lib/features.ts', {}, dev, flag).ENABLE_DEMO_BILLING, dev && flag === 'true');
  }
});

test('disabled demo cannot activate premium or store payment details', async t => {
  const exports = load('SubscriptionContext.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../data/subscription': { TRIAL_DAYS: 7 }, '../lib/features': { ENABLE_DEMO_BILLING: false },
  });
  let current, renderer;
  function Probe() { current = exports.useSubscription(); return null; }
  await act(async () => { renderer = create(React.createElement(exports.SubscriptionProvider, null, React.createElement(Probe))); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  await act(async () => {
    current.subscribe('annual', { kind: 'card', last4: '4242' });
    current.setPaymentMethod({ kind: 'card', last4: '4242' });
  });
  assert.equal(current.isPremium, false);
  assert.equal(current.plan, 'free');
  assert.equal(current.paymentMethod, null);
  assert.equal(current.trialEndsOn, null);
});

test('disabled checkout never renders payment inputs or a purchase action', async t => {
  const native = { Platform: { OS: 'web' }, StyleSheet: { create: value => value },
    View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView' };
  const exports = load('../screens/CheckoutScreen.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'react-native': native,
    'phosphor-react-native': { CreditCard: 'CreditCard', LockSimple: 'LockSimple' },
    '../assets/PaymentMarks': {}, '../components/AppHeader': { AppHeader: 'AppHeader' },
    '../components/BottomBar': { BottomBarSlot: 'BottomBarSlot' },
    '../components/LabeledInput': { LabeledInput: 'LabeledInput' },
    '../components/Ring': { Ring: 'Ring' }, '../components/ScreenTitleRow': { ScreenTitleRow: 'ScreenTitleRow' },
    '../data/subscription': {}, '../i18n': { useDisplayFont: () => ({}), useLocale: () => 'en', useT: () => key => key },
    '../theme/tokens': { color: {}, font: {}, frame: {}, shadow: {} },
    '../lib/features': { ENABLE_DEMO_BILLING: false },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(exports.CheckoutScreen, {
    mode: 'subscribe', billing: 'annual', current: null, onBack() {}, onChangeTab() {},
    activeTab: 'home', onConfirm: () => assert.fail('Unexpected purchase'),
  })); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  assert.equal(renderer.root.findAllByType('LabeledInput').length, 0);
  assert.equal(renderer.root.findAllByType('Pressable').length, 0);
  assert.ok(JSON.stringify(renderer.toJSON()).includes('flows.checkout.unavailableBody'));
});
