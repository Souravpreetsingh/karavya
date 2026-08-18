'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start, stop, request, cookieJar, registerUser, seedAdmin, cleanDb, db } = require('./helpers');

before(async () => {
  await start();
  await cleanDb();
});

after(async () => {
  await stop();
});

const PICK = db.prepare("SELECT id, name, price_cents FROM products WHERE availability != 'out_of_stock' AND sizes_json != '[]' ORDER BY name LIMIT 1").get();

const ADDR = {
  fullName: 'Aria Shah',
  phone: '+91 98765 43210',
  line1: '12 Rosewood Lane',
  line2: 'Suite 4B',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

async function authedUser(email) {
  const jar = cookieJar();
  await request('POST', '/api/auth/register', { body: { firstName: 'Order', lastName: 'Tester', email, password: 'Passw0rd123' }, jar });
  return jar;
}

async function makeOrder(jar, email) {
  const cart = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 2 }, jar });
  const res = await request('POST', '/api/orders', { body: { shippingAddress: ADDR }, jar });
  return res;
}

test('orders require auth', async () => {
  const res = await request('GET', '/api/orders');
  assert.strictEqual(res.status, 401);
});

test('cannot create order with empty cart', async () => {
  const jar = await authedUser('ord0@test.dev');
  const res = await request('POST', '/api/orders', { body: { shippingAddress: ADDR }, jar });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.json.error.code, 'EMPTY_CART');
});

test('create order: server-side totals, cart cleared, snapshot items', async () => {
  const jar = await authedUser('ord1@test.dev');
  const res = await makeOrder(jar, 'ord1@test.dev');
  assert.strictEqual(res.status, 201);
  const order = res.json.data.order;

  assert.strictEqual(order.totals.subtotal, PICK.price_cents * 2 / 100);
  assert.strictEqual(order.totals.shipping, 0, 'free shipping above ₹5,000 threshold');
  assert.strictEqual(order.totals.tax, Math.round(PICK.price_cents * 2 * 0.05) / 100);
  assert.strictEqual(order.totals.total, order.totals.subtotal + order.totals.tax);
  assert.match(order.orderNumber, /^KR-\d+$/);
  assert.strictEqual(order.paymentStatus, 'pending');
  assert.strictEqual(order.items.length, 1);
  assert.strictEqual(order.items[0].name, PICK.name);

  const cart = await request('GET', '/api/cart', { jar });
  assert.strictEqual(cart.json.data.cart.items.length, 0, 'cart cleared after order');
});

test('shipping charged below free threshold (₹2,499 Cloudline, qty 1)', async () => {
  const cheap = db.prepare('SELECT id FROM products WHERE price_cents = 249900 LIMIT 1').get();
  const jar = await authedUser('ord2@test.dev');
  await request('POST', '/api/cart/items', { body: { productId: cheap.id, size: 'M', quantity: 1 }, jar });
  const res = await request('POST', '/api/orders', { body: { shippingAddress: ADDR }, jar });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.json.data.order.totals.shipping, 500, '₹500 flat shipping');
});

test('order access is owner-only (IDOR)', async () => {
  const jarA = await authedUser('ordA@test.dev');
  const jarB = await authedUser('ordB@test.dev');
  const created = await makeOrder(jarA, 'ordA@test.dev');
  const orderId = created.json.data.order.id;

  const b = await request('GET', `/api/orders/${orderId}`, { jar: jarB });
  assert.strictEqual(b.status, 403, 'user B must not read user A order');

  const a = await request('GET', `/api/orders/${orderId}`, { jar: jarA });
  assert.strictEqual(a.status, 200);
});

test('orders list shows own orders only', async () => {
  const jarA = await authedUser('ordC@test.dev');
  await makeOrder(jarA, 'ordC@test.dev');
  const list = await request('GET', '/api/orders', { jar: jarA });
  assert.strictEqual(list.status, 200);
  assert.ok(list.json.data.items.length >= 1);
  for (const o of list.json.data.items) {
    const get = await request('GET', `/api/orders/${o.id}`, { jar: jarA });
    assert.strictEqual(get.status, 200);
  }
});

test('status update requires admin role', async () => {
  const jarA = await authedUser('ordD@test.dev');
  const created = await makeOrder(jarA, 'ordD@test.dev');
  const orderId = created.json.data.order.id;

  const denied = await request('PATCH', `/api/orders/${orderId}/status`, { body: { status: 'delivered' }, jar: jarA });
  assert.strictEqual(denied.status, 403);

  const admin = await seedAdmin();
  const adminJar = cookieJar();
  await request('POST', '/api/auth/login', { body: { email: admin.email, password: admin.password }, jar: adminJar });
  const okRes = await request('PATCH', `/api/orders/${orderId}/status`, { body: { status: 'shipped' }, jar: adminJar });
  assert.strictEqual(okRes.status, 200);
  assert.strictEqual(okRes.json.data.order.status, 'shipped');
});