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

const P1 = db.prepare("SELECT id FROM products WHERE availability != 'out_of_stock' ORDER BY name LIMIT 1").get();
const P2 = db.prepare("SELECT id FROM products WHERE availability != 'out_of_stock' ORDER BY name LIMIT 1 OFFSET 1").get();

async function authedUser(email) {
  const jar = cookieJar();
  await request('POST', '/api/auth/register', { body: { firstName: 'Flow', lastName: 'Tester', email, password: 'Passw0rd123' }, jar });
  return jar;
}

const ADDR = {
  fullName: 'Aria Shah',
  phone: '+91 98765 43210',
  line1: '12 Rosewood Lane',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

test('guest cart + wishlist merge on register', async () => {
  const jar = cookieJar();
  const res = await request('POST', '/api/auth/register', {
    body: {
      firstName: 'Merge',
      email: 'merge1@test.dev',
      password: 'Passw0rd123',
      guestCart: [
        { productId: P1.id, size: 'M', quantity: 2 },
        { productId: P2.id, quantity: 1 },
      ],
      guestWishlist: [P1.id, P2.id, P1.id],
    },
    jar,
  });
  assert.strictEqual(res.status, 201);
  const cart = res.json.data.cart;
  assert.strictEqual(cart.items.length, 2);
  const wl = res.json.data.wishlist;
  assert.strictEqual(wl.items.length, 2, 'duplicates removed on merge');
});

test('guest merge on login merges into existing account cart without duplicates', async () => {
  const jar = cookieJar();
  await request('POST', '/api/auth/register', { body: { firstName: 'A', email: 'merge2@test.dev', password: 'Passw0rd123' }, jar });
  await request('POST', '/api/cart/items', { body: { productId: P1.id, size: 'M', quantity: 1 }, jar });
  await request('POST', '/api/auth/logout', { jar });

  const jar2 = cookieJar();
  const login = await request('POST', '/api/auth/login', {
    body: {
      email: 'merge2@test.dev',
      password: 'Passw0rd123',
      guestCart: [{ productId: P1.id, size: 'M', quantity: 1 }],
    },
    jar: jar2,
  });
  assert.strictEqual(login.status, 200);
  const p1items = login.json.data.cart.items.filter((i) => i.productId === P1.id && i.size === 'M');
  assert.strictEqual(p1items.length, 1, 'no duplicate variant');
  assert.strictEqual(p1items[0].quantity, 2, 'quantities merged');
});

test('style profile: save + read + update', async () => {
  const jar = await authedUser('flow1@test.dev');
  const answers = { 1: 'muse', 2: 'quiet', 3: 'muse', 4: 'muse' };
  const saved = await request('POST', '/api/quiz/style-profile', { body: { answers, quizVersion: 'v1' }, jar });
  assert.strictEqual(saved.status, 201);
  assert.strictEqual(saved.json.data.profile.archetype.key, 'muse', 'deterministic majority archetype');
  assert.strictEqual(saved.json.data.profile.archetype.label, 'The Romantic Muse');

  const got = await request('GET', '/api/quiz/style-profile', { jar });
  assert.strictEqual(got.json.data.profile.answers['1'], 'muse');

  const patched = await request('PATCH', '/api/quiz/style-profile', { body: { answers: { 1: 'playful', 2: 'playful', 3: 'playful', 4: 'playful' } }, jar });
  assert.strictEqual(patched.json.data.profile.archetype.key, 'playful');
});

test('style profile requires answers', async () => {
  const jar = await authedUser('flow2@test.dev');
  const res = await request('POST', '/api/quiz/style-profile', { body: {}, jar });
  assert.strictEqual(res.status, 400);
});

test('fit profile: create, read, update, delete', async () => {
  const jar = await authedUser('flow3@test.dev');
  const created = await request('POST', '/api/fit/fit-profile', {
    body: { heightCm: 165, weightKg: 55, sizePreference: 'S', measurements: { bust: 86, waist: 66, hips: 92 } },
    jar,
  });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.json.data.profile.sizePreference, 'S');

  const got = await request('GET', '/api/fit/fit-profile', { jar });
  assert.strictEqual(got.json.data.profile.heightCm, 165);

  const removed = await request('DELETE', '/api/fit/fit-profile', { jar });
  assert.strictEqual(removed.status, 200);
  const gone = await request('GET', '/api/fit/fit-profile', { jar });
  assert.strictEqual(gone.json.data.profile, null);
});

test('gift preferences + recommendations under budget', async () => {
  const jar = await authedUser('flow4@test.dev');
  const saved = await request('POST', '/api/gifting/gift-preferences', {
    body: { occasion: 'Birthday', recipientType: 'Sister', budgetMax: 5000 },
    jar,
  });
  assert.strictEqual(saved.status, 201);
  assert.strictEqual(saved.json.data.preferences.recipientType, 'Sister');

  const recs = await request('GET', '/api/gifting/gift-recommendations?budgetMax=3000', { jar });
  assert.strictEqual(recs.status, 200);
  assert.ok(recs.json.data.items.length > 0);
  for (const p of recs.json.data.items) assert.ok(p.price.cents <= 300000);
});

test('addresses: create, list, default handling, update, delete', async () => {
  const jar = await authedUser('flow5@test.dev');
  const created = await request('POST', '/api/addresses', { body: ADDR, jar });
  assert.strictEqual(created.status, 201);
  const a1 = created.json.data.address;
  assert.strictEqual(a1.isDefault, true, 'first address becomes default');

  const second = await request('POST', '/api/addresses', { body: { ...ADDR, fullName: 'Second', isDefault: true }, jar });
  assert.strictEqual(second.json.data.address.isDefault, true);
  const list = await request('GET', '/api/addresses', { jar });
  const defaults = list.json.data.addresses.filter((a) => a.isDefault);
  assert.strictEqual(defaults.length, 1, 'only one default');

  const updated = await request('PATCH', `/api/addresses/${a1.id}`, { body: { ...ADDR, city: 'Pune' }, jar });
  assert.strictEqual(updated.json.data.address.city, 'Pune');

  const removed = await request('DELETE', `/api/addresses/${a1.id}`, { jar });
  assert.strictEqual(removed.status, 200);
  const gone = await request('GET', `/api/addresses/${a1.id}`, { jar });
  assert.strictEqual(gone.status, 404);
});

test('returns: real policy, create from owned order, ownership enforced', async () => {
  const jar = await authedUser('flow6@test.dev');
  const policy = await request('GET', '/api/returns/policy');
  assert.strictEqual(policy.json.data.policy.windowDays, 30);
  assert.match(policy.json.data.policy.summary, /unworn/);

  await request('POST', '/api/cart/items', { body: { productId: P1.id, size: 'M', quantity: 2 }, jar });
  const order = await request('POST', '/api/orders', { body: { shippingAddress: ADDR }, jar });
  const orderId = order.json.data.order.id;
  const orderItemId = order.json.data.order.items[0].id;

  const tooMany = await request('POST', '/api/returns', {
    body: { orderId, items: [{ orderItemId, quantity: 5 }] },
    jar,
  });
  assert.strictEqual(tooMany.status, 400, 'cannot return more than ordered');

  const created = await request('POST', '/api/returns', {
    body: { orderId, reason: 'Changed my mind', items: [{ orderItemId, quantity: 1 }] },
    jar,
  });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.json.data.returnRequest.status, 'requested');

  const jarB = await authedUser('flow7@test.dev');
  const other = await request('GET', `/api/returns/${created.json.data.returnRequest.id}`, { jar: jarB });
  assert.strictEqual(other.status, 403, 'cannot read another user return');

  const mine = await request('GET', `/api/returns/${created.json.data.returnRequest.id}`, { jar });
  assert.strictEqual(mine.status, 200);
});

test('editorial + lookbook endpoints return seeded real content', async () => {
  const ed = await request('GET', '/api/editorial');
  assert.strictEqual(ed.status, 200);
  assert.ok(ed.json.data.items.length >= 1);
  const story = await request('GET', '/api/editorial/the-art-of-slow-living');
  assert.strictEqual(story.status, 200);
  assert.strictEqual(story.json.data.story.title, 'The Art of Slow Living');
  assert.ok(story.json.data.story.relatedProducts.length > 0, 'related products resolved from catalog');

  const lb = await request('GET', '/api/lookbook');
  assert.strictEqual(lb.status, 200);
  assert.ok(lb.json.data.items.length >= 1);
  const one = await request('GET', '/api/lookbook/the-season-in-motion');
  assert.strictEqual(one.status, 200);
  assert.ok(one.json.data.lookbook.looks.length >= 2);
});

test('user profile update rejects role change', async () => {
  const jar = await authedUser('flow8@test.dev');
  const res = await request('PATCH', '/api/users/me', { body: { role: 'admin', preferredSize: 'M' }, jar });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.user.role, 'customer', 'role cannot be changed');
  assert.strictEqual(res.json.data.user.preferredSize, 'M');
});