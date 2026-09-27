const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function load(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, relative);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency ${name}`);
    return dependencies[name];
  }, mod, mod.exports);
  return mod.exports;
}
const features = load('featureAvailability.ts');
const native = { View: 'View', Text: 'Text', ScrollView: 'ScrollView', Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: value => value } };
const tokens = { color: {}, font: {}, frame: {}, shadow: {} };
const icons = new Proxy({}, { get: (_, key) => String(key) });
const noop = () => {};
const i18n = { useDisplayFont: () => ({}), useDirection: () => ({ isRTL: false }),
  useLocale: () => 'en', useT: () => (key, values) => key + (values ? JSON.stringify(values) : '') };
const base = { 'react-native': native, 'phosphor-react-native': icons,
  '../i18n': i18n, '../theme/tokens': tokens, '../lib/featureAvailability': features };
async function render(t, component, props) {
  let renderer;
  await act(async () => { renderer = create(React.createElement(component, props)); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  return renderer;
}

test('every unfinished feature and its detail/edit destinations are unavailable', () => {
  assert.equal(features.isFeatureReady('googleAuth'), true);
  assert.equal('appleAuth' in features.featureAvailability, false);
  assert.equal(features.isFeatureReady('guidedHelp'), true);
  assert.equal(features.isFeatureReady('emergencyContact'), true);
  for (const feature of Object.keys(features.featureAvailability).filter(key => !['googleAuth', 'guidedHelp', 'emergencyContact'].includes(key))) {
    assert.equal(features.isFeatureReady(feature), false);
  }
  for (const [route, feature] of Object.entries({
    liv: 'liv', professionals: 'professionals', professional: 'professionals',
    exerciseVideos: 'exercises', exerciseLibrary: 'exercises', editExercises: 'exercises',
    meditationDrills: 'meditation', subscription: 'subscription', checkout: 'subscription',
  })) assert.equal(features.pendingFeatureForRoute(route), feature);
  for (const route of ['helpFlow', 'calendar', 'dayDetail', 'signIn', 'signUp', 'bugReport', 'onboarding', 'constructor']) {
    assert.equal(features.pendingFeatureForRoute(route), null);
  }
});

test('all pending feature copy exists in both languages without English fallback', () => {
  for (const locale of ['en', 'he']) {
    const dictionary = Object.assign({}, ...['browse', 'auth', 'common', 'flows'].map(ns => load(`../i18n/${locale}/${ns}.ts`)));
    for (const { title, note } of Object.values(features.featureCopy)) {
      for (const key of [title, note, 'browse.placeholder.heading', 'browse.placeholder.releaseNote']) {
        const value = key.split('.').reduce((node, part) => node?.[part], dictionary);
        assert.equal(typeof value, 'string', `${locale}: ${key}`);
        assert.ok(value.length > 0);
      }
    }
  }
});

test('Liv pending screen keeps the avatar but no composer, microphone, or start action', async t => {
  const { PlaceholderScreen } = load('../screens/PlaceholderScreen.tsx', {
    ...base, '../components/AppHeader': { AppHeader: 'AppHeader' },
    '../components/BottomBar': { BottomBarSlot: 'BottomBarSlot' },
    '../components/ScreenTitleRow': { ScreenTitleRow: 'ScreenTitleRow' },
  });
  const { ComingSoonScreen } = load('../screens/ComingSoonScreen.tsx', {
    '../components/liv/LivAvatar': { LivAvatar: 'LivAvatar' }, '../i18n': i18n,
    '../lib/featureAvailability': features, './PlaceholderScreen': { PlaceholderScreen },
  });
  const renderer = await render(t, ComingSoonScreen, { feature: 'liv' });
  assert.equal(renderer.root.findAllByType('LivAvatar').length, 1);
  assert.equal(renderer.root.findAllByType('Pressable').length, 0);
  const tree = JSON.stringify(renderer.toJSON());
  assert.ok(tree.includes('browse.placeholder.heading'));
  assert.ok(tree.includes('browse.pending.liv'));
  assert.ok(!tree.includes('Composer') && !tree.includes('VoiceListening'));
});

test('Google and email are usable and Apple sign-in is absent', async t => {
  let emails = 0;
  let google = 0;
  const { AuthSheet } = load('../components/auth/AuthSheet.tsx', {
    'react-native': native, 'phosphor-react-native': icons,
    '../../assets/PaymentMarks': { AppleGlyph: 'AppleGlyph', GoogleGlyph: 'GoogleGlyph' },
    '../../data/access': { UNLOCK_LINE: {}, UNLOCK_LINE_GENERIC: 'auth.unlock.generic' },
    '../../i18n': i18n, '../../lib/featureAvailability': features, '../../theme/tokens': tokens,
    '../../state/AuthContext': { useAuth: () => ({ session: { status: 'guest' }, isAuthenticating: false }) },
    '../BottomSheet': { BottomSheet: 'BottomSheet' }, '../Ring': { Ring: 'Ring' },
  });
  const renderer = await render(t, AuthSheet, { visible: true, capability: null, onClose: noop,
    onGoogle: () => google++, onEmail: () => emails++ });
  const rows = renderer.root.findAllByType('Pressable');
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.props.disabled, false);
    assert.ok(!row.props.accessibilityLabel.includes('browse.placeholder.heading'));
    row.props.onPress();
  }
  assert.equal(renderer.root.findAllByType('AppleGlyph').length, 0);
  assert.equal(google, 1);
  assert.equal(emails, 1);
});

test('pending menu items display their status and never imply a sign-in or premium unlock', async t => {
  const { MenuScreen } = load('../screens/MenuScreen.tsx', {
    ...base, '../components/AppHeader': { AppHeader: 'AppHeader' },
    '../components/BottomBar': { BottomBarSlot: 'BottomBarSlot' },
    '../components/BottomSheet': { BottomSheet: 'BottomSheet' },
    '../components/MenuList': { MenuGroup: 'MenuGroup', MenuRow: 'MenuRow' },
    '../components/ProgressDonut': { ProgressDonut: 'ProgressDonut' }, '../components/Ring': { Ring: 'Ring' },
    '../data/access': { useCapabilities: () => ({ can: () => false, reasonFor: () => 'premium' }) },
    '../data/onboarding': { ONBOARDING_STEP_COUNT: 4, onboardingPercent: () => 100 },
    '../state/AuthContext': { useAuth: () => ({ isGuest: false, account: { email: 'test@example.test' }, needsOnboarding: false,
      session: { status: 'authed', progressStep: 4 } }) },
    '../state/SubscriptionContext': { useSubscription: () => ({ isPremium: false }) },
    '../state/PreferencesContext': { usePreferences: () => ({ language: 'en', setLanguage: noop }), LANGUAGE_LABEL: {}, LANGUAGE_FLAG: {} },
  });
  let opened = 0;
  const renderer = await render(t, MenuScreen, { onOpenPlaceholder: () => opened++,
    onOpenSubscription: () => assert.fail('Payment wall invoked'), onRequestSignIn: () => assert.fail('Auth wall invoked') });
  const rows = renderer.root.findAllByType('MenuRow');
  const pending = rows.filter(row => row.props.comingSoon);
  assert.equal(pending.length, 7);
  assert.ok(pending.every(row => !['premium', 'locked', 'external'].includes(row.props.variant)));
  rows.find(row => row.props.label === 'browse.menu.rowCommunity').props.onPress();
  assert.equal(opened, 1);
});

test('Home excludes pending exercises from daily completion and does not show a sample name', async t => {
  const { HomeStatusScreen } = load('../screens/HomeStatusScreen.tsx', {
    ...base, '../assets/placeholders': { WAVING_HAND: 'wave' },
    '../components/AppHeader': { AppHeader: 'AppHeader' }, '../components/BottomBar': { BottomBarSlot: 'BottomBarSlot' },
    '../components/Celebration': { Celebration: 'Celebration' },
    '../components/home/FeelingSheet': { FeelingSheet: 'FeelingSheet' }, '../components/home/SleepSheet': { SleepSheet: 'SleepSheet' },
    '../components/home/TaskCard': { TaskCard: 'TaskCard' }, '../components/home/HomeCarousel': { HomeCarousel: 'HomeCarousel' },
    '../data/dayRecords': { describeSleep: () => '8 hours', episodeTrendKey: () => 'trend', episodeWeek: () => [], streakEndingToday: () => 1 },
    '../data/tips': { selectTips: () => [] }, '../state/AuthContext': { useAuth: () => ({ session: { status: 'guest' } }) },
    '../state/DayRecordsContext': { useDayRecords: () => ({ records: new Map(), today: new Date(), todayKey: '2026-09-24',
      getRecord: () => ({ feeling: 'good', sleepHours: 8 }), recordFeeling: noop, recordSleep: noop }) },
    '../state/ExercisesContext': { useExercises: () => ({ exercises: [{ completed: false }] }) },
  });
  const renderer = await render(t, HomeStatusScreen, { onOpenExercises: noop });
  const card = renderer.root.findAllByType('TaskCard').find(node => node.props.tone === 'exercises');
  assert.equal(card.props.comingSoon, true);
  assert.equal(card.props.completed, false);
  const tree = JSON.stringify(renderer.toJSON());
  assert.ok(tree.includes('home.status.allDone') && tree.includes('home.status.welcome'));
});

test('daily streaks also exclude unavailable exercises on previous days', () => {
  const data = load('../data/dayRecords.ts', { '../i18n': {}, './helpFlow': {} });
  const today = new Date(2026, 8, 24);
  const yesterday = { ...data.emptyRecord('2026-09-23'), feeling: 'good', sleepHours: 8 };
  const records = new Map([[yesterday.date, yesterday]]);
  assert.equal(data.streakEndingToday(records, today, true, false), 2);
  assert.equal(data.streakEndingToday(records, today, true, true), 1);
  assert.equal(data.isDayComplete({ ...yesterday, sleepHours: null }, false), false);
});

test('unfinished symptom tracking does not display invented weekly health insights', async t => {
  const { WeeklyStatusCard } = load('../components/home/WeeklyStatusCard.tsx', {
    'react-native': native, '../../i18n': i18n, '../../lib/featureAvailability': features,
    '../../theme/tokens': tokens, '../Ring': { Ring: 'Ring' },
  });
  const renderer = await render(t, WeeklyStatusCard, { headline: 'Unverified improvement claim', week: [] });
  const tree = JSON.stringify(renderer.toJSON());
  assert.ok(tree.includes('browse.placeholder.heading'));
  assert.ok(tree.includes('browse.pending.symptomInsights'));
  assert.ok(!tree.includes('Unverified improvement claim'));
});
