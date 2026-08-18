'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start, stop, request, cookieJar, registerUser, cleanDb, db } = require('./helpers');

before(async () => {
  await start();
  await cleanDb();
});

after(async () => {
  await stop();
});

const P1 = db.prepare("SELECT id FROM products WHERE availability != 'out_of_stock' ORDER BY name LIMIT 1").get();
const P2 = db.prepare("SELECT id FROM products WHERE availability != 'out_of_stock' ORDER BY name LIMIT 1 OFFSET 1").get();

async function authedUser(email) {
  const jar = cookieJar();
  await request('POST', '/api/auth/register', { body: { firstName: 'WL', lastName: 'Tester', email, password: 'Passw0rd123' }, jar });
  return jar;
}

test('wishlist requires auth', async () => {
  const res = await request('GET', '/api/wishlist');
  assert.strictEqual(res.status, 401);
});

test('add / remove / toggle wishlist items', async () => {
  const jar = await authedUser('wl1@test.dev');
  const added = await request('POST', '/api/wishlist/items', { body: { productId: P1.id }, jar });
  assert.strictEqual(added.status, 201);
  assert.strictEqual(added.json.data.wishlist.items.length, 1);
  assert.strictEqual(added.json.data.wishlist.items[0].id, P1.id);

  const dup = await request('POST', '/api/wishlist/items', { body: { productId: P1.id }, jar });
  assert.strictEqual(dup.json.data.wishlist.items.length, 1, 'no duplicates');

  const toggled = await request('POST', '/api/wishlist/toggle', { body: { productId: P1.id }, jar });
  assert.strictEqual(toggled.json.data.wishlist.saved, false);
  assert.strictEqual(toggled.json.data.wishlist.items.length, 0);

  const removed = await request('DELETE', `/api/wishlist/items/${P1.id}`, { jar });
  assert.strictEqual(removed.json.data.wishlist.items.length, 0);
});

test('wishlist rejects unknown products', async () => {
  const jar = await authedUser('wl2@test.dev');
  const res = await request('POST', '/api/wishlist/items', { body: { productId: '00000000-0000-4000-8000-000000000000' }, jar });
  assert.strictEqual(res.status, 404);
});

test('wishlist is isolated per user (IDOR)', async () => {
  const jarA = await authedUser('wlA@test.dev');
  const jarB = await authedUser('wlB@test.dev');
  await request('POST', '/api/wishlist/items', { body: { productId: P1.id }, jarA });
  const b = await request('GET', '/api/wishlist', { jar: jarB });
  assert.strictEqual(b.json.data.wishlist.items.length, 0);
});