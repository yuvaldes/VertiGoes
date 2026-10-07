// Run: node --test src/state/AuthContext.test.cjs
// Real React, AuthProvider, AppShell, and OnboardingScreen; only their dependencies are mocked.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function loadSource(relativePath, dependencies = {}) {
  const filename = path.resolve(__dirname, relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  const customRequire = (name) => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name} in ${filename}`);
    return dependencies[name];
  };
  new Function('require', 'module', 'exports', outputText)(customRequire, module, module.exports);
  return module.exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const success = (data = null) => ({ data, error: null });
const failure = (code = 'offline') => ({ data: null, error: { code, message: 'Private backend detail' } });
const login = { email: 'alice@example.test', password: 'test-password' };
const user = (id) => ({ id, email: `${id}@example.test`, app_metadata: { provider: 'email' } });
const sessionFor = (id) => ({ user: user(id), access_token: `access-${id}`, refresh_token: `refresh-${id}` });
const { initialOnboardingAnswers } = loadSource('../data/onboarding.ts');
const answersFor = (id) => ({
  ...initialOnboardingAnswers, firstName: id, age: '42', language: 'en',
  manualDiagnosis: `${id}'s private medical history`,
});
const profileFor = (id, onboarding = 'complete') => ({
  id, onboarding_status: onboarding,
  answers: onboarding === 'complete' ? answersFor(id) : null,
  progress_step: onboarding === 'skipped' ? 2 : null,
});

function makeBackend(initial = null) {
  const listeners = new Set();
  const calls = { reads: [], writes: [], auth: [], functions: [] };
  const profiles = new Map(['alice', 'bob'].map(id => [id, profileFor(id)]));
  let insideAuthCallback = false;
  const backend = {
    current: initial, calls, profiles, listeners,
    emit(event, next) {
      backend.current = next;
      insideAuthCallback = true;
      try { for (const callback of listeners) callback(event, next); }
      finally { insideAuthCallback = false; }
    },
    read: async (id) => success(profiles.get(id) ?? null),
    invoke: async () => success({ deleted: true }),
    write: async (row) => {
      profiles.set(row.id, { ...profileFor(row.id, 'pending'), ...profiles.get(row.id), ...row });
      return success();
    },
    methods: {
      initialize: async () => ({ error: null }),
      signInWithPassword: async () => {
        const session = sessionFor('alice');
        backend.emit('SIGNED_IN', session);
        return success({ session, user: session.user });
      },
      signUp: async () => success({ session: null, user: user('alice') }),
      signOut: async () => { backend.emit('SIGNED_OUT', null); return success(); },
      resetPasswordForEmail: async () => success(),
      updateUser: async () => success({ user: backend.current?.user }),
      setSession: async () => {
        const session = sessionFor('alice');
        backend.emit('SIGNED_IN', session);
        return success({ session, user: session.user });
      },
      signInWithOAuth: async () => success({ url: 'https://provider.example.test/authorize' }),
      startAutoRefresh() {}, stopAutoRefresh() {},
    },
  };
  const client = {
    auth: {
      onAuthStateChange(callback) {
        listeners.add(callback);
        // The SDK emits INITIAL_SESSION asynchronously after subscribing.
        queueMicrotask(() => {
          if (!listeners.has(callback)) return;
          insideAuthCallback = true;
          try { callback('INITIAL_SESSION', backend.current); }
          finally { insideAuthCallback = false; }
        });
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      },
    },
    from(table) {
      assert.equal(insideAuthCallback, false, 'Do not query Supabase inside its auth callback');
      assert.ok(table === 'profiles' || table === 'legal_consents');
      let id;
      const isConsentQuery = table === 'legal_consents';
      const query = {
        select() { return query; },
        eq(column, value) {
          assert.ok(isConsentQuery ? column === 'user_id' || column === 'document_version' : column === 'id');
          if (column === 'id' || column === 'user_id') id = value;
          return query;
        },
        maybeSingle() { calls.reads.push(id); return backend.read(id); },
        single() { calls.reads.push(id); return backend.read(id); },
        then(resolve, reject) {
          if (!isConsentQuery) return Promise.resolve().then(resolve, reject);
          return Promise.resolve(success([
            { document_type: 'medical_disclaimer', document_version: '1.0' },
            { document_type: 'health_data_processing', document_version: '1.0' },
          ])).then(resolve, reject);
        },
        upsert(row, options) {
          calls.writes.push({ row, options, actor: backend.current?.user.id ?? null });
          return backend.write(row, options);
        },
      };
      return query;
    },
    functions: {
      async invoke(name, options) {
        calls.functions.push({ name, options });
        return backend.invoke(name, options);
      },
    },
  };
  for (const name of Object.keys(backend.methods)) {
    client.auth[name] = (...args) => {
      calls.auth.push({ name, args });
      return backend.methods[name](...args);
    };
  }
  return Object.assign(backend, { client });
}

const noop = () => {};
const host = (name) => function MockDependency(props) { return React.createElement(name, props); };
const passthrough = ({ children }) => children;

async function mountAuth(t, options = {}) {
  const backend = options.backend ?? makeBackend(options.initial ?? null);
  const links = new Set();
  const appStates = new Set();
  const native = {
    Platform: { OS: options.platform ?? 'web' },
    AppState: {
      currentState: 'active',
      addEventListener(_event, callback) {
        appStates.add(callback);
        return { remove: () => appStates.delete(callback) };
      },
    },
  };
  const browser = { openAuthSessionAsync: async () => ({ type: 'cancel' }) };
  const authModule = loadSource('AuthContext.tsx', {
    'react-native': native,
    'expo-auth-session': { makeRedirectUri: () => options.redirectUri ?? 'vertigoes://auth/callback' },
    'expo-linking': {
      getInitialURL: async () => options.initialURL ?? null,
      addEventListener(_event, callback) {
        links.add(callback);
        return { remove: () => links.delete(callback) };
      },
    },
    'expo-web-browser': browser,
    '../lib/supabase': { supabase: options.configured === false ? null : backend.client },
    '../lib/authConfig': { CAPTCHA_REQUIRED: Boolean(options.captchaRequired) },
  });
  const snapshots = [];
  let value;
  function Probe() {
    value = authModule.useAuth();
    snapshots.push({ session: value.session, restoring: value.isRestoring });
    return null;
  }
  const shell = options.shell ? makeShell(authModule, native) : null;
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(authModule.AuthProvider, null,
      React.createElement(Probe), shell && React.createElement(shell.AppShell)));
  });
  t.after(async () => {
    await act(async () => renderer.unmount());
    assert.equal(backend.listeners.size, 0);
    assert.equal(links.size, 0);
    assert.equal(appStates.size, 0);
  });
  return {
    backend, renderer, browser, snapshots, shell,
    get value() { return value; },
    async emit(event, next) { await act(async () => backend.emit(event, next)); },
    async link(url) { await act(async () => { for (const callback of links) callback({ url }); }); },
    async call(method, ...args) {
      let result;
      await act(async () => { result = await value[method](...args); });
      return result;
    },
    async start(method, ...args) {
      let promise;
      await act(async () => { promise = value[method](...args); });
      return { promise };
    },
    async resolve(pending, result) { await act(async () => pending.resolve(result)); },
  };
}

function makeShell(authModule, native) {
  class AnimatedValue {
    interpolate() { return 0; }
  }
  const rn = {
    ...native,
    ...Object.fromEntries(['ActivityIndicator', 'KeyboardAvoidingView', 'Pressable', 'ScrollView', 'Text', 'View'].map(name => [name, name])),
    StyleSheet: { create: value => value, absoluteFillObject: {} },
    Animated: { Value: AnimatedValue, View: 'AnimatedView', timing: () => ({ start: callback => callback?.() }) },
    Easing: { cubic: noop, in: value => value, out: value => value },
    Linking: { openURL: async () => {} },
  };
  const i18n = { useT: () => key => key, useDateFormat: () => ({ monthDay: () => 'September 24' }), useDirection: () => ({ isRTL: false }) };
  const tokens = { color: {}, font: {}, frame: { width: 393, gutter: 16 } };
  const resets = [];
  const gate = {
    can: () => true, gate: (_capability, action) => action, sheet: { visible: false, capability: null },
    closeSheet: noop, hideSheet: noop, consumeIntent: () => null, promptAuth: noop, promptSignIn: noop,
  };
  const records = { today: new Date('2026-09-24T12:00:00Z'), todayKey: '2026-09-24', syncStatus: 'saved', retrySync: noop,
    recordEmergencyCall: noop, recordInAppHelp: noop, reset: () => resets.push('records') };
  const chat = { refreshDaySummary: noop, reset: () => resets.push('chat') };
  const exercises = { reset: () => resets.push('exercises') };
  const preferences = { setLanguage: noop };
  const subscription = { subscribe: noop, setPaymentMethod: noop, paymentMethod: null, cancel: () => resets.push('subscription') };
  const dependencies = {
    'react-native': rn, '../i18n': i18n, '../theme/tokens': tokens,
    '../lib/featureAvailability': loadSource('../lib/featureAvailability.ts'),
    '../state/AuthContext': authModule,
    '../state/AuthGateContext': { AuthGateProvider: passthrough, useGate: () => gate },
    '../state/DayRecordsContext': { useDayRecords: () => records },
    '../state/LivChatContext': { useLivChat: () => chat },
    '../state/ExercisesContext': { useExercises: () => exercises },
    '../state/PreferencesContext': { usePreferences: () => preferences },
    '../state/SubscriptionContext': { useSubscription: () => subscription },
    '../state/OnboardingDraftContext': { useOnboardingDraft: () => ({ draft: { step: 0, completed: false, answers: initialOnboardingAnswers }, ready: true, patch: noop, setStep: noop, setCompleted: noop, setConsent: noop, clear: async () => {} }) },
    '../data/home': { emergencyContact: { phone: '', name: '' } },
    '../components/SheetHost': { SheetHostProvider: passthrough },
    './useEdgeSwipeBack': { useEdgeSwipeBack: () => ({ rootRef: null, panHandlers: {} }) },
  };
  const shellSource = readFileSync(path.resolve(__dirname, '../navigation/AppShell.tsx'), 'utf8');
  for (const [, name, modulePath] of shellSource.matchAll(/import \{ (\w+) \} from '(\.\.\/(?:screens|components)\/[^']+)';/g)) {
    if (!(modulePath in dependencies)) dependencies[modulePath] = { [name]: host(name) };
  }
  // Keep the actual local wizard state: replacing it with a stub would hide the account leak.
  const onboardingDependencies = {
    'react-native': rn, '../i18n': i18n, '../theme/tokens': tokens,
    '../state/AuthContext': authModule,
    '../state/OnboardingDraftContext': { useOnboardingDraft: () => ({ draft: { step: 0, completed: false, answers: initialOnboardingAnswers }, patch: noop, setStep: noop, setCompleted: noop }) },
    '../data/onboarding': { initialOnboardingAnswers, ONBOARDING_STEP_COUNT: 4 },
    '../components/AppHeader': { AppHeader: passthrough },
    '../components/BackButton': { BackButton: host('BackButton') },
  };
  for (const name of ['OnboardingBasicInfoStep', 'OnboardingDiagnosisStep', 'OnboardingEmergencyContactStep', 'OnboardingMedicalHistoryStep']) {
    onboardingDependencies[`./${name}`] = { [name]: host(name) };
  }
  dependencies['../screens/OnboardingScreen'] = loadSource('../screens/OnboardingScreen.tsx', onboardingDependencies);
  return { ...loadSource('../navigation/AppShell.tsx', dependencies), resets };
}

test('valid email login waits for the saved profile; it never invents an authenticated account', async (t) => {
  const backend = makeBackend();
  const profile = deferred();
  backend.read = () => profile.promise;
  const h = await mountAuth(t, { backend });
  assert.equal(h.value.isAuthed, false);
  const result = await h.call('signInWithEmail', { ...login, email: ' alice@example.test ' });
  assert.equal(result.ok, true);
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.value.isRestoring, true);
  assert.deepEqual(backend.calls.auth.find(call => call.name === 'signInWithPassword').args, [login]);
  await h.resolve(profile, success(profileFor('alice')));
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.value.onboarding, 'complete');
  assert.deepEqual(h.value.session.answers, answersFor('alice'));
  assert.equal(h.value.isRestoring, false);
  assert.equal(backend.calls.writes.length, 0);
  assert.equal(JSON.stringify(h.value.session).includes(login.password), false);
});

for (const status of ['complete', 'skipped']) {
  test(`INITIAL_SESSION restores a saved ${status} profile and token refresh does not overwrite it`, async (t) => {
    const backend = makeBackend(sessionFor('alice'));
    backend.profiles.set('alice', profileFor('alice', status));
    const h = await mountAuth(t, { backend });
    assert.equal(h.value.onboarding, status);
    assert.equal(h.value.session.progressStep, status === 'skipped' ? 2 : null);
    await h.emit('TOKEN_REFRESHED', { ...sessionFor('alice'), access_token: 'refreshed' });
    assert.equal(h.value.onboarding, status);
    assert.deepEqual(backend.calls.reads, ['alice']);
    assert.deepEqual(backend.calls.writes, []);
  });
}

test('a missing profile is created and reread before authenticating', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  backend.profiles.delete('alice');
  const h = await mountAuth(t, { backend });
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.value.onboarding, 'pending');
  assert.deepEqual(backend.calls.reads, ['alice', 'alice']);
  assert.deepEqual(backend.calls.writes[0].row, { id: 'alice' });
  assert.equal(backend.calls.writes[0].options.ignoreDuplicates, true);
});

for (const scenario of ['invalid credentials', 'network exception']) {
  test(`${scenario} cannot authenticate and exposes only localized errors`, async (t) => {
    const backend = makeBackend();
    backend.methods.signInWithPassword = async () => {
      if (scenario === 'network exception') throw new Error('Private backend detail');
      return failure('invalid_credentials');
    };
    const h = await mountAuth(t, { backend });
    const result = await h.call('signInWithEmail', login);
    assert.equal(result.ok, false);
    assert.equal(result.errors.form.key, scenario === 'invalid credentials' ? 'auth.error.credentials' : 'auth.error.connection');
    assert.equal(h.value.isAuthed, false);
    assert.equal(h.value.isAuthenticating, false);
    assert.deepEqual(backend.calls.reads, []);
    assert.equal(JSON.stringify(result).includes('Private backend detail'), false);
  });
}

test('invalid form and missing configuration never contact the backend', async (t) => {
  const h = await mountAuth(t, { configured: false });
  assert.equal(h.value.isRestoring, false);
  assert.equal((await h.call('signInWithEmail', { email: 'bad', password: '' })).ok, false);
  assert.equal((await h.call('signInWithEmail', login)).errors.form.key, 'auth.error.notConfigured');
  assert.deepEqual(h.backend.calls.auth, []);
});

test('confirmation-required signup stays signed out and does not create a profile', async (t) => {
  const h = await mountAuth(t);
  const result = await h.call('signUpWithEmail', {
    ...login,
    confirm: login.password,
    acceptedTerms: true,
    acceptedPrivacy: true,
    acceptedHealthData: true,
    acceptedAiProcessing: false,
    acceptedResearch: false,
    acceptedMarketing: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.confirmationRequired, true);
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.value.account, null);
  assert.deepEqual(h.backend.calls.reads, []);
  assert.deepEqual(h.backend.calls.writes, []);
});

test('profile load failure stays unauthenticated and retry restores the saved profile', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  backend.read = async () => failure();
  const h = await mountAuth(t, { backend });
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.value.isRestoring, false);
  assert.equal(h.value.authError.key, 'auth.error.profileLoad');
  backend.read = async id => success(profileFor(id));
  await h.call('retryProfile');
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.value.authError, null);
});

test('sign-out discards a pending profile read', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  const read = deferred();
  backend.read = () => read.promise;
  const h = await mountAuth(t, { backend });
  assert.equal(await h.call('signOut'), true);
  await h.resolve(read, success(profileFor('alice')));
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.value.account, null);
  assert.equal(h.value.isRestoring, false);
});

test('an old profile response cannot overwrite the newly signed-in account', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  const read = deferred();
  backend.read = id => id === 'alice' ? read.promise : Promise.resolve(success(profileFor(id)));
  const h = await mountAuth(t, { backend });
  await h.emit('SIGNED_IN', sessionFor('bob'));
  await h.resolve(read, success(profileFor('alice')));
  assert.equal(h.value.account.id, 'bob');
  assert.deepEqual(h.value.session.answers, answersFor('bob'));
});

test('switching identity immediately hides the previous account while its replacement loads', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  const read = deferred();
  h.backend.read = () => read.promise;
  await h.emit('SIGNED_IN', sessionFor('bob'));
  assert.equal(h.value.isRestoring, true);
  assert.equal(h.value.account, null, 'Alice must not remain exposed under Bob’s SDK session');
  assert.equal(h.value.isAuthed, false);
});

test('an immediate save after SIGNED_IN(B) cannot write A’s cached profile while B loads', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  const read = deferred();
  h.backend.read = () => read.promise;
  const saveFromPreviousRender = h.value.completeOnboarding;
  let result;
  await act(async () => {
    h.backend.emit('SIGNED_IN', sessionFor('bob'));
    // Invoke before React has rendered again: the callback must invalidate refs synchronously.
    result = await saveFromPreviousRender(answersFor('alice'));
  });
  assert.equal(result.ok, false);
  assert.equal(h.value.account, null);
  assert.equal(h.value.isRestoring, true);
  assert.deepEqual(h.backend.calls.writes, [], 'Do not even issue an Alice write with Bob’s SDK identity');
});

test('a failed login after a failed identity switch must not resurrect the previous account', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  h.backend.read = async () => failure();
  await h.emit('SIGNED_IN', sessionFor('bob'));
  assert.equal(h.value.account, null);
  h.backend.methods.signInWithPassword = async () => failure('invalid_credentials');
  assert.equal((await h.call('signInWithEmail', login)).ok, false);
  assert.equal(h.backend.current.user.id, 'bob');
  assert.equal(h.value.account, null, 'A failed login must not restore cached Alice');
  assert.equal(h.value.isAuthed, false);
});

for (const method of ['skipOnboarding', 'completeOnboarding']) {
  test(`${method} failure preserves pending onboarding and releases the save lock`, async (t) => {
    const backend = makeBackend(sessionFor('alice'));
    backend.profiles.set('alice', profileFor('alice', 'pending'));
    const h = await mountAuth(t, { backend });
    backend.write = async () => failure();
    const arg = method === 'skipOnboarding' ? 2 : answersFor('alice');
    const result = await h.call(method, arg);
    assert.equal(result.ok, false);
    assert.equal(result.errors.form.key, 'auth.error.profileSave');
    assert.equal(h.value.onboarding, 'pending');
    assert.equal(h.value.session.answers, null);
    assert.equal(h.value.isSavingProfile, false);
    backend.write = async () => success();
    assert.equal((await h.call(method, arg)).ok, true);
    assert.equal(h.value.onboarding, method === 'skipOnboarding' ? 'skipped' : 'complete');
  });
}

for (const [code, key] of [['PT429', 'auth.error.rateLimit'], ['22023', 'auth.error.profileInvalid']]) {
  test(`profile save explains ${code} without exposing database details`, async (t) => {
    const backend = makeBackend(sessionFor('alice'));
    backend.profiles.set('alice', profileFor('alice', 'pending'));
    const h = await mountAuth(t, { backend });
    backend.write = async () => failure(code);
    const result = await h.call('completeOnboarding', answersFor('alice'));
    assert.equal(result.ok, false);
    assert.equal(result.errors.form.key, key);
    assert.equal(h.value.onboarding, 'pending');
  });
}

test('a pending save is not completion and repeated taps cannot start another write', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  backend.profiles.set('alice', profileFor('alice', 'pending'));
  const h = await mountAuth(t, { backend });
  const write = deferred();
  backend.write = () => write.promise;
  const operation = await h.start('completeOnboarding', answersFor('alice'));
  assert.equal(h.value.isSavingProfile, true);
  assert.equal(h.value.onboarding, 'pending');
  assert.equal((await h.call('skipOnboarding', 1)).ok, false);
  assert.equal(backend.calls.writes.length, 1);
  await h.resolve(write, success());
  assert.equal((await operation.promise).ok, true);
  assert.equal(h.value.onboarding, 'complete');
});

for (const event of ['SIGNED_OUT', 'SIGNED_IN']) {
  test(`a save completing after ${event} cannot restore the old profile`, async (t) => {
    const h = await mountAuth(t, { initial: sessionFor('alice') });
    const write = deferred();
    h.backend.write = () => write.promise;
    const operation = await h.start('completeOnboarding', { ...answersFor('alice'), age: '99' });
    await h.emit(event, event === 'SIGNED_OUT' ? null : sessionFor('bob'));
    await h.resolve(write, success());
    assert.equal((await operation.promise).ok, false);
    assert.equal(h.value.account?.id ?? null, event === 'SIGNED_OUT' ? null : 'bob');
    if (event === 'SIGNED_IN') assert.deepEqual(h.value.session.answers, answersFor('bob'));
  });
}

for (const outcome of ['returned error', 'thrown exception']) {
  test(`an old save’s ${outcome} cannot replace the new account’s authError`, async (t) => {
    const h = await mountAuth(t, { initial: sessionFor('alice') });
    const write = deferred();
    h.backend.write = () => write.promise;
    const operation = await h.start('completeOnboarding', answersFor('alice'));
    await h.emit('SIGNED_IN', sessionFor('bob'));
    assert.equal(h.value.account.id, 'bob');
    assert.equal(h.value.authError, null);
    await act(async () => {
      if (outcome === 'returned error') write.resolve(failure());
      else write.reject(new Error('Alice’s old request failed'));
      await operation.promise;
    });
    assert.equal((await operation.promise).ok, false);
    assert.equal(h.value.account.id, 'bob');
    assert.equal(h.value.authError, null, 'Only Bob’s operations may change Bob’s authError');
  });
}

test('a missing-profile response arriving after sign-out cannot start a profile write', async (t) => {
  const backend = makeBackend(sessionFor('alice'));
  const read = deferred();
  backend.read = () => read.promise;
  const h = await mountAuth(t, { backend });
  await h.call('signOut');
  await h.resolve(read, success(null));
  assert.equal(h.value.account, null);
  assert.deepEqual(backend.calls.writes, [], 'Discard a cancelled read before attempting profile creation');
});

test('sign-out failure keeps the session and returns failure to its caller', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  h.backend.methods.signOut = async () => failure();
  assert.equal(await h.call('signOut'), false);
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.value.authError.key, 'auth.error.connection');
});

test('account deletion calls only the protected function, clears tokens, and signs out locally', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  const result = await h.call('deleteAccount');
  assert.equal(result.ok, true);
  assert.deepEqual(h.backend.calls.functions, [
    { name: 'delete-account', options: { method: 'POST' } },
  ]);
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.backend.calls.auth.at(-1).name, 'signOut');
  assert.deepEqual(h.backend.calls.auth.at(-1).args, [{ scope: 'local' }]);
});

test('failed account deletion preserves the signed-in account', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice') });
  h.backend.invoke = async () => failure('function_error');
  const result = await h.call('deleteAccount');
  assert.equal(result.ok, false);
  assert.equal(result.errors.form.key, 'auth.error.deleteAccount');
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.backend.calls.auth.some(call => call.name === 'signOut'), false);
});

test('password reset validates the email and forwards the redirect without exposing backend details', async (t) => {
  const h = await mountAuth(t);
  assert.equal((await h.call('requestPasswordReset', 'invalid')).ok, false);
  assert.equal(h.backend.calls.auth.some(call => call.name === 'resetPasswordForEmail'), false);
  assert.equal((await h.call('requestPasswordReset', ' alice@example.test ')).ok, true);
  assert.deepEqual(h.backend.calls.auth.find(call => call.name === 'resetPasswordForEmail').args,
    ['alice@example.test', { redirectTo: 'vertigoes://auth/callback' }]);
  assert.equal(h.value.isAuthed, false);
});

test('PASSWORD_RECOVERY persists on update failure and ends only after successful update', async (t) => {
  const h = await mountAuth(t);
  await h.emit('PASSWORD_RECOVERY', sessionFor('alice'));
  assert.equal(h.value.recoveringPassword, true);
  assert.equal((await h.call('updatePassword', 'short')).ok, false);
  assert.equal(h.backend.calls.auth.some(call => call.name === 'updateUser'), false);
  h.backend.methods.updateUser = async () => failure();
  assert.equal((await h.call('updatePassword', 'new-password')).ok, false);
  assert.equal(h.value.recoveringPassword, true);
  h.backend.methods.updateUser = async () => success({ user: user('alice') });
  assert.equal((await h.call('updatePassword', 'new-password')).ok, true);
  assert.equal(h.value.recoveringPassword, false);
  assert.equal(JSON.stringify(h.value.session).includes('new-password'), false);
});

test('sign-out clears password recovery', async (t) => {
  const h = await mountAuth(t);
  await h.emit('PASSWORD_RECOVERY', sessionFor('alice'));
  await h.call('signOut');
  assert.equal(h.value.recoveringPassword, false);
  assert.equal(h.value.account, null);
});

test('password recovery cannot carry over to a different authenticated account', async (t) => {
  const h = await mountAuth(t);
  await h.emit('PASSWORD_RECOVERY', sessionFor('alice'));
  await h.emit('SIGNED_IN', sessionFor('bob'));
  assert.equal(h.value.account.id, 'bob');
  assert.equal(h.value.recoveringPassword, false, 'A recovery prompt must remain bound to its identity');
});

test('native callbacks ignore other paths and accept a valid recovery callback', async (t) => {
  const h = await mountAuth(t, { platform: 'ios' });
  await h.link('vertigoes://elsewhere#access_token=test-access&refresh_token=test-refresh&type=recovery');
  assert.equal(h.backend.calls.auth.some(call => call.name === 'setSession'), false);
  assert.equal(h.value.recoveringPassword, false);
  await h.link('vertigoes://auth/callback#access_token=test-access&refresh_token=test-refresh&type=recovery');
  assert.equal(h.value.account.id, 'alice');
  assert.equal(h.value.recoveringPassword, true);
  assert.deepEqual(h.backend.calls.auth.find(call => call.name === 'setSession').args,
    [{ access_token: 'test-access', refresh_token: 'test-refresh' }]);
});

test('a rejected native recovery link must not open recovery for the already signed-in account', async (t) => {
  const h = await mountAuth(t, { platform: 'ios', initial: sessionFor('bob') });
  h.backend.methods.setSession = async () => failure('bad_jwt');
  await h.link('vertigoes://auth/callback#access_token=invalid&refresh_token=invalid&type=recovery');
  assert.equal(h.value.account.id, 'bob');
  assert.equal(h.value.authError.key, 'auth.error.connection');
  assert.equal(h.value.recoveringPassword, false, 'A rejected link must not authorize Bob’s password reset UI');
});

test('Google callback creates a missing profile and persists onboarding for the returned user', async (t) => {
  const h = await mountAuth(t, { platform: 'ios' });
  h.backend.profiles.delete('alice');
  h.backend.methods.setSession = async () => {
    const session = sessionFor('alice');
    session.user.app_metadata.provider = 'google';
    h.backend.emit('SIGNED_IN', session);
    return success({ session, user: session.user });
  };
  h.browser.openAuthSessionAsync = async () => ({ type: 'success', url: 'vertigoes://auth/callback#access_token=test-access&refresh_token=test-refresh' });
  assert.equal((await h.call('signInWithProvider', 'google')).ok, true);
  assert.equal(h.value.account.method, 'google');
  assert.equal(h.backend.profiles.has('alice'), true);
  assert.equal((await h.call('skipOnboarding', 2)).ok, true);
  assert.equal(h.backend.profiles.get('alice').progress_step, 2);
  assert.deepEqual(h.backend.calls.auth.find(call => call.name === 'signInWithOAuth').args,
    [{ provider: 'google', options: { redirectTo: 'vertigoes://auth/callback', skipBrowserRedirect: true } }]);
});

test('email sign-in requires and forwards configured CAPTCHA tokens', async (t) => {
  const h = await mountAuth(t, { captchaRequired: true });
  const form = { email: 'alice@example.test', password: 'test-password' };
  const refused = await h.call('signInWithEmail', form);
  assert.equal(refused.errors.form.key, 'auth.error.captcha');
  assert.equal(h.backend.calls.auth.some(call => call.name === 'signInWithPassword'), false);
  assert.equal((await h.call('signInWithEmail', { ...form, captchaToken: 'test-challenge' })).ok, true);
  assert.deepEqual(h.backend.calls.auth.find(call => call.name === 'signInWithPassword').args,
    [{ ...form, options: { captchaToken: 'test-challenge' } }]);
});

test('OAuth initialization errors are visible instead of silently leaving a guest session', async (t) => {
  const backend = makeBackend();
  backend.methods.initialize = async () => failure('oauth_error');
  const h = await mountAuth(t, { backend });
  assert.equal(h.value.isAuthed, false);
  assert.equal(h.value.isRestoring, false);
  assert.equal(h.value.authError.key, 'auth.error.oauthReturn');
});

test('Expo Go does not start a Google round trip that cannot return to the app', async (t) => {
  const h = await mountAuth(t, { platform: 'ios', redirectUri: 'exp://192.168.1.2:8081/--/auth/callback' });
  const result = await h.call('signInWithProvider', 'google');
  assert.equal(result.errors.form.key, 'auth.error.oauthUseWeb');
  assert.equal(h.backend.calls.auth.some(call => call.name === 'signInWithOAuth'), false);
});

test('native provider session rejection must be returned as failure to AppShell', async (t) => {
  const h = await mountAuth(t, { platform: 'ios' });
  h.browser.openAuthSessionAsync = async () => ({ type: 'success', url: 'vertigoes://auth/callback#access_token=invalid&refresh_token=invalid' });
  h.backend.methods.setSession = async () => failure('bad_jwt');
  const result = await h.call('signInWithProvider', 'google');
  assert.equal(result.ok, false, 'AppShell must not close auth UI after a rejected callback');
  assert.equal(h.value.isAuthed, false);
});

async function openProfile(h) {
  await act(async () => h.renderer.root.findByType('BottomBar').props.onChangeTab('menu'));
  await act(async () => h.renderer.root.findByType('MenuScreen').props.onOpenOnboarding());
  assert.equal(h.renderer.root.findByType('OnboardingBasicInfoStep').props.answers.firstName, 'alice');
}

test('AppShell removes the previous account’s medical form on automatic sign-out', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice'), shell: true });
  await openProfile(h);
  await h.emit('SIGNED_OUT', null);
  const forms = h.renderer.root.findAllByType('OnboardingBasicInfoStep');
  assert.equal(forms.length, 0, 'Signed-out users must not see Alice’s mounted medical form');
});

test('AppShell never submits the previous account’s mounted medical answers as the new account', async (t) => {
  const h = await mountAuth(t, { initial: sessionFor('alice'), shell: true });
  await openProfile(h);
  await h.emit('SIGNED_IN', sessionFor('bob'));
  assert.equal(h.value.account.id, 'bob');
  // Advance any surviving actual wizard and try its actual completion callback.
  for (let step = 0; step < 4; step++) {
    const button = h.renderer.root.findAllByType('Pressable').find(node =>
      node.findAllByType('Text').some(text => ['flows.onboarding.continue', 'flows.onboarding.finish'].includes(text.props.children)));
    if (!button) break;
    await act(async () => button.props.onPress());
  }
  assert.equal(h.backend.calls.writes.some(({ row }) =>
    row.id === 'bob' && row.answers?.manualDiagnosis === answersFor('alice').manualDiagnosis), false,
  'Alice’s medical history must never be written into Bob’s profile');
});

test('AppShell leaves the report mounted when successful email auth closes its sign-in screen', async (t) => {
  const h = await mountAuth(t, { shell: true });
  await act(async () => h.renderer.root.findByType('BottomBar').props.onChangeTab('menu'));
  await act(async () => h.renderer.root.findByType('MenuScreen').props.onReportBug());
  const report = h.renderer.root.findByType('BugReportScreen');
  await act(async () => report.props.onRequestSignIn());
  assert.equal((await h.call('signInWithEmail', login)).ok, true);
  await act(async () => h.renderer.root.findByType('SignInScreen').props.onSignedIn());
  assert.equal(h.renderer.root.findAllByType('SignInScreen').length, 0);
  assert.equal(h.renderer.root.findByType('BugReportScreen'), report);
});

for (const initial of [null, sessionFor('alice')]) {
  test(`pending destinations never mount demos for ${initial ? 'signed-in users' : 'guests'}`, async t => {
    const h = await mountAuth(t, { initial, shell: true });
    const tab = async name => act(async () => h.renderer.root.findByType('BottomBar').props.onChangeTab(name));
    await tab('liv');
    assert.equal(h.renderer.root.findByType('ComingSoonScreen').props.feature, 'liv');
    assert.equal(h.renderer.root.findAllByType('LivScreen').length, 0);
    await tab('home');
    await act(async () => h.renderer.root.findByType('HomeStatusScreen').props.onOpenExercises());
    assert.equal(h.renderer.root.findByType('ComingSoonScreen').props.feature, 'exercises');
    assert.equal(h.renderer.root.findAllByType('ExerciseVideosScreen').length, 0);
    for (const [action, feature, hidden] of [
      ['onOpenExercises', 'exercises', 'ExerciseLibraryScreen'],
      ['onOpenProfessionals', 'professionals', 'ProfessionalsScreen'],
      ['onOpenMeditationDrills', 'meditation', 'MeditationDrillsScreen'],
      ['onOpenSubscription', 'subscription', 'SubscriptionScreen'],
    ]) {
      await tab('menu');
      await act(async () => h.renderer.root.findByType('MenuScreen').props[action]());
      assert.equal(h.renderer.root.findByType('ComingSoonScreen').props.feature, feature);
      assert.equal(h.renderer.root.findAllByType(hidden).length, 0);
    }
    await tab('home');
    await act(async () => h.renderer.root.findByType('EmergencySheet').props.onHelp());
    assert.equal(h.renderer.root.findAllByType('HelpFlowScreen').length, 1);
    await act(async () => h.renderer.root.findByType('HelpFlowScreen').props.onBack());
    await tab('home');
    await act(async () => h.renderer.root.findByType('EmergencySheet').props.onCall());
    assert.equal(h.renderer.root.findAllByType('ComingSoonScreen').length, 0);
    assert.equal(h.renderer.root.findByType('AuthSheet').props.onApple, undefined);
  });
}
