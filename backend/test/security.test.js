'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start, stop, request, cleanDb } = require('./helpers');

before(async () => {
  await start();
  await cleanDb();
});

after(async () => {
  await stop();
});

test('health endpoint works', async () => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.status, 'ok');
});

test('unknown route returns consistent 404 envelope', async () => {
  const res = await request('GET', '/api/nope');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.json.success, false);
  assert.strictEqual(res.json.error.code, 'NOT_FOUND');
});

test('server errors are sanitized (no stack traces)', async () => {
  const res = await request('GET', '/api/products/not-a-uuid');
  assert.strictEqual(res.status, 400);
  assert.ok(!JSON.stringify(res.json).includes('at '), 'no stack trace leaked');
  assert.ok(!JSON.stringify(res.json).includes('node_modules'));
});

test('oversized JSON body rejected', async () => {
  const big = 'x'.repeat(200 * 1024);
  const res = await request('POST', '/api/auth/register', { body: { firstName: big, email: 'big@test.dev', password: 'Passw0rd123' } });
  assert.strictEqual(res.status, 413, 'body size limited');
});

test('CORS blocks unknown origins when credentials are involved', async () => {
  const res = await request('GET', '/api/health', { origin: 'https://evil.example' });
  assert.ok(!res.headers.get('access-control-allow-origin'), 'no ACAO header for blocked origin');
});

test('CORS allows configured origin', async () => {
  const res = await request('GET', '/api/health', { origin: 'http://localhost:3000' });
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

test('security headers present (helmet)', async () => {
  const res = await request('GET', '/api/health');
  assert.ok(res.headers.get('x-content-type-options') === 'nosniff');
  assert.ok(res.headers.get('x-frame-options'));
  assert.ok(!res.headers.get('x-powered-by'));
});

test('session cookie is httpOnly and sameSite', async () => {
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Cookie', email: 'cookie@test.dev', password: 'Passw0rd123' },
  });
  const cookies = res.headers.getSetCookie();
  const sid = cookies.find((c) => c.startsWith('kaya.sid='));
  assert.ok(sid, 'session cookie set');
  assert.ok(/HttpOnly/i.test(sid), 'httpOnly');
  assert.ok(/SameSite=Lax/i.test(sid), 'sameSite lax');
});

test('mass assignment on addresses cannot set user_id', async () => {
  const jar = (await (async () => {
    const { cookieJar } = require('./helpers');
    const j = cookieJar();
    await request('POST', '/api/auth/register', { body: { firstName: 'MA', email: 'ma@test.dev', password: 'Passw0rd123' }, jar: j });
    return j;
  })());
  const res = await request('POST', '/api/addresses', {
    body: { fullName: 'X', phone: '123456', line1: 'L', city: 'C', state: 'S', pincode: '400001', user_id: '00000000-0000-4000-8000-000000000000' },
    jar,
  });
  assert.strictEqual(res.status, 201);
  assert.notStrictEqual(res.json.data.address.id, '00000000-0000-4000-8000-000000000000');
});