'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start, stop, request, cookieJar, cleanDb, db } = require('./helpers');

before(async () => {
  await start();
  await cleanDb();
});

after(async () => {
  await stop();
});

test('POST /api/auth/register creates a user and session', async () => {
  const jar = cookieJar();
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Aria', lastName: 'Shah', email: 'aria@test.dev', password: 'Passw0rd123' },
    jar,
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.json.success, true);
  assert.strictEqual(res.json.data.user.email, 'aria@test.dev');
  assert.strictEqual(res.json.data.user.role, 'customer');
  assert.ok(!('passwordHash' in res.json.data.user), 'password hash must never be returned');
  assert.ok(jar.get().startsWith('kaya.sid='), 'session cookie set');
});

test('POST /api/auth/register rejects duplicate email', async () => {
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Aria', email: 'aria@test.dev', password: 'Passw0rd123' },
  });
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.json.error.code, 'EMAIL_TAKEN');
});

test('POST /api/auth/register rejects weak password', async () => {
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Weak', email: 'weak@test.dev', password: 'abc' },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.json.error.code, 'VALIDATION_ERROR');
});

test('POST /api/auth/login with wrong password fails', async () => {
  const res = await request('POST', '/api/auth/login', {
    body: { email: 'aria@test.dev', password: 'Wrongpass1' },
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.json.error.code, 'INVALID_CREDENTIALS');
});

test('POST /api/auth/login succeeds with correct password', async () => {
  const jar = cookieJar();
  const res = await request('POST', '/api/auth/login', {
    body: { email: 'aria@test.dev', password: 'Passw0rd123' },
    jar,
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.user.email, 'aria@test.dev');
});

test('GET /api/auth/me requires authentication', async () => {
  const res = await request('GET', '/api/auth/me');
  assert.strictEqual(res.status, 401);
});

test('GET /api/auth/me returns the session user', async () => {
  const jar = cookieJar();
  await request('POST', '/api/auth/login', { body: { email: 'aria@test.dev', password: 'Passw0rd123' }, jar });
  const res = await request('GET', '/api/auth/me', { jar });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.user.email, 'aria@test.dev');
});

test('POST /api/auth/logout destroys the session', async () => {
  const jar = cookieJar();
  await request('POST', '/api/auth/login', { body: { email: 'aria@test.dev', password: 'Passw0rd123' }, jar });
  const out = await request('POST', '/api/auth/logout', { jar });
  assert.strictEqual(out.status, 200);
  const me = await request('GET', '/api/auth/me', { jar });
  assert.strictEqual(me.status, 401);
});

test('password reset flow: forgot + reset', async () => {
  const forgot = await request('POST', '/api/auth/forgot-password', { body: { email: 'aria@test.dev' } });
  assert.strictEqual(forgot.status, 200);
  assert.strictEqual(forgot.json.data.sent, true);

  const row = db.prepare('SELECT token_hash FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1').get();
  assert.ok(row);
  const token = 'reset-token-test-' + row.token_hash.slice(0, 8);

  const bad = await request('POST', '/api/auth/reset-password', { body: { token: 'a'.repeat(48), newPassword: 'Newpass1234' } });
  assert.strictEqual(bad.status, 400);
  assert.strictEqual(bad.json.error.code, 'INVALID_TOKEN');

  const login = await request('POST', '/api/auth/login', { body: { email: 'aria@test.dev', password: 'Passw0rd123' } });
  assert.strictEqual(login.status, 200, 'password unchanged when reset fails');
});

test('role escalation attempt is ignored', async () => {
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Sneaky', email: 'sneaky@test.dev', password: 'Passw0rd123', role: 'admin' },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.json.data.user.role, 'customer');
});

test('forgot-password does not reveal account existence', async () => {
  const res = await request('POST', '/api/auth/forgot-password', { body: { email: 'ghost@test.dev' } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.sent, true);
});