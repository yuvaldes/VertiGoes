const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const publicDir = path.resolve(__dirname, '../../public');
const readPublic = (file) => readFileSync(path.join(publicDir, file), 'utf8');

test('install manifest and HTML support home-screen installation', () => {
  const manifest = JSON.parse(readPublic('manifest.json'));
  assert.equal(manifest.name, 'VertiGoes');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.prefer_related_applications, false);
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);
  const html = readPublic('index.html');
  assert.match(html, /rel="manifest" href="\/manifest.json"/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-touch-icon/);
  assert.doesNotMatch(html, /maximum-scale|user-scalable=no/);
});

function worker(network = async () => new Response('online')) {
  const handlers = {};
  const removed = [];
  const cached = [];
  const cache = {
    add: async (request) => cached.push(request.url),
    match: async () => new Response('offline fallback'),
  };
  vm.runInNewContext(readPublic('sw.js'), {
    self: {
      location: { origin: 'https://app.example.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      skipWaiting: async () => {}, clients: { claim: async () => {} },
    },
    caches: {
      open: async () => cache,
      keys: async () => ['vertigoes-offline-v0', 'vertigoes-offline-v1', 'unrelated-cache'],
      delete: async (key) => { removed.push(key); return true; },
    },
    // A browser resolves relative Request URLs against the service worker's origin.
    Request: class extends Request {
      constructor(url, options) { super(new URL(url, 'https://app.example.test'), options); }
    },
    Response, URL, fetch: network,
  });
  return { handlers, removed, cached };
}

test('service worker precaches only the generic offline page', async () => {
  const { handlers, cached } = worker();
  let done;
  handlers.install({ waitUntil: (promise) => { done = promise; } });
  await done;
  assert.deepEqual(cached, ['https://app.example.test/offline.html']);
});

test('service worker deletes only its own outdated offline cache', async () => {
  const { handlers, removed } = worker();
  let done;
  handlers.activate({ waitUntil: (promise) => { done = promise; } });
  await done;
  assert.deepEqual(removed, ['vertigoes-offline-v0']);
});

test('service worker never intercepts Supabase, writes, or JS assets', () => {
  const { handlers } = worker();
  for (const request of [
    { method: 'GET', mode: 'cors', url: 'https://project.supabase.co/rest/v1/profiles' },
    { method: 'GET', mode: 'navigate', url: 'https://project.supabase.co/auth/v1/callback' },
    { method: 'POST', mode: 'navigate', url: 'https://app.example.test/' },
    { method: 'GET', mode: 'cors', url: 'https://app.example.test/index.js' },
  ]) handlers.fetch({ request, respondWith: () => assert.fail('Private or non-navigation request intercepted') });
});

for (const offline of [false, true]) {
  test(`service worker ${offline ? 'shows a fallback offline' : 'uses the network for online navigation'}`, async () => {
    const { handlers } = worker(async () => {
      if (offline) throw new Error('No network');
      return new Response('online');
    });
    let result;
    handlers.fetch({
      request: { method: 'GET', mode: 'navigate', url: 'https://app.example.test/' },
      respondWith: (promise) => { result = promise; },
    });
    assert.equal(await (await result).text(), offline ? 'offline fallback' : 'online');
  });
}
