const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
function loadTs(file, mocks) {
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { exports: mod.exports, module: mod, require: id => id in mocks ? mocks[id] : require(id), URL, Request, Response, console: mocks.console || console, crypto: globalThis.crypto, process });
  return mod.exports;
}
const runtime = loadTs('lib/auth-runtime.ts', {});
const sanitizer = loadTs('lib/user-auth.ts', { './auth-runtime': runtime, './supabase-auth': {} }).sanitizeUserRedirectPath;
const identity = { authUserId: 'synthetic-id', email: 'synthetic@example.invalid', preferredUsername: 'synthetic', name: 'Synthetic', firstName: 'Synthetic', lastName: null, expiresAt: 2000000000 };
function harness(options = {}) {
  const logs = [];
  const calls = [];
  const fail = (stage) => { if (options.fail === stage) throw new Error(options.message || 'PRIVATE_PASSWORD SQL_PATH TOKEN'); };
  const route = loadTs('app/api/auth/login/route.ts', {
    'next/server': { NextResponse },
    '@/lib/auth-runtime': { ...runtime, getRequestAppBaseUrl: request => { fail('runtime'); return new URL(request.url).origin; } },
    '@/lib/bot-protection': { readBotProtectionFromFormData: () => ({}), verifyBotProtectedRequest: async () => { fail('bot'); return { ok: !options.botReject }; } },
    '@/lib/user-auth': {
      sanitizeUserRedirectPath: sanitizer, userSessionCookieName: 'buddies_user_session', userLoginCookieName: 'buddies_user_login',
      signInMarketplaceUser: async () => { calls.push('signin'); fail('auth'); return identity; },
      signUpMarketplaceUser: async () => { calls.push('register'); fail('auth'); return { needsEmailConfirmation: !!options.confirm, identity }; },
      createUserSessionCookieValue: async () => { calls.push('session'); fail('session'); return 'synthetic-cookie'; },
    },
    '@/lib/users-store': { upsertMarketplaceUser: async () => { calls.push('profile'); fail('profile'); return options.nullProfile ? null : { id: 'synthetic-profile' }; } },
    console: { error: (...values) => logs.push(values) },
  });
  return { ...route, logs, calls };
}
function request(mode = 'register', next = '/listings/new-service', empty = false, origin = 'https://test.invalid') {
  return new Request(`${origin}/api/auth/login?mode=${mode}&next=${encodeURIComponent(next)}`, { method: 'POST', body: new URLSearchParams(empty ? {} : { email: 'synthetic@example.invalid', password: 'PRIVATE_PASSWORD', displayName: 'Synthetic' }) });
}
const cases = [
 ['register', {}, 'register', null], ['signin', {}, 'signin', null],
 ['confirmation', { confirm: true }, 'register', 'check_email'],
 ['bot rejection', { botReject: true }, 'register', 'bot_protection_failed'],
 ['missing credentials', { empty: true }, 'register', 'missing_credentials'],
 ['invalid credentials', { fail: 'auth', message: 'Invalid login credentials' }, 'signin', 'invalid_credentials'],
 ['unconfirmed email', { fail: 'auth', message: 'Email not confirmed' }, 'signin', 'email_not_confirmed'],
 ['provider failure', { fail: 'auth' }, 'register', 'sign_up_failed'],
 ['profile failure', { fail: 'profile' }, 'register', 'profile_failed'],
 ['null profile', { nullProfile: true }, 'register', 'profile_failed'],
 ['session failure', { fail: 'session' }, 'register', 'session_failed'],
 ['runtime failure', { fail: 'runtime' }, 'register', 'auth_unavailable'],
 ['bot exception', { fail: 'bot' }, 'register', 'auth_unavailable'],
];
for (const [name, opts, mode, error] of cases) test(`POST ${name}: safe 303 and GET follow`, async () => {
 const h = harness(opts);
 const response = await h.POST(request(mode, '/listings/new-service', opts.empty));
 assert.equal(response.status, 303);
 const location = new URL(response.headers.get('location'));
 assert.equal(location.origin, 'https://test.invalid');
 if (error) { assert.equal(location.pathname, '/signup'); assert.equal(location.searchParams.get(error === 'check_email' ? 'check_email' : 'error'), error === 'check_email' ? '1' : error); }
 else { assert.equal(location.pathname, '/listings/new-service'); const cookies = response.headers.get('set-cookie'); for (const flag of ['buddies_user_session=synthetic-cookie', 'HttpOnly', 'Secure', 'SameSite=lax', 'Path=/']) assert.ok(cookies.includes(flag)); }
 assert.ok(!response.headers.get('location').includes('PRIVATE_PASSWORD'));
 const serializedLogs = JSON.stringify(h.logs); for (const secret of ['PRIVATE_PASSWORD', 'SQL_PATH', 'TOKEN', 'synthetic@example.invalid']) assert.ok(!serializedLogs.includes(secret));
 // Node fetch uses ordinary redirect semantics; the bridge changes only the origin.
 const methods = [];
 const server = createServer((req, res) => { if (req.url === '/start') { res.writeHead(response.status, { Location: location.pathname + location.search }); res.end(); } else { methods.push(req.method); res.end('destination'); } });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 try { await fetch(`http://127.0.0.1:${server.address().port}/start`, { method: 'POST', body: 'synthetic=1' }); assert.deepEqual(methods, ['GET']); } finally { await new Promise(resolve => server.close(resolve)); }
});
for (const next of ['https://evil.invalid/', '//evil.invalid/', '/api/private', '/\\evil.invalid/', '/\nevil.invalid/']) test(`unsafe next ${JSON.stringify(next)} stays local`, async () => { const r = await harness().POST(request('signin', next)); assert.equal(r.status, 303); assert.equal(r.headers.get('location'), 'https://test.invalid/listings'); });
test('GET remains method-preserving navigation', async () => { const r = await harness().GET(new Request('https://test.invalid/api/auth/login?mode=register')); assert.equal(r.status, 307); });
