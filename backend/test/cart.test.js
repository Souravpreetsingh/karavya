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

const PICK = db.prepare("SELECT id, name, price_cents FROM products WHERE availability != 'out_of_stock' AND sizes_json != '[]' ORDER BY name LIMIT 1").get();
const OOS = db.prepare("SELECT id FROM products WHERE availability = 'out_of_stock' LIMIT 1").get();
const NO_SIZE = db.prepare("SELECT id FROM products WHERE sizes_json = '[]' LIMIT 1").get();

async function authedUser(email) {
  const jar = cookieJar();
  await request('POST', '/api/auth/register', { body: { firstName: 'Cart', lastName: 'Tester', email, password: 'Passw0rd123' }, jar });
  return jar;
}

test('cart requires authentication', async () => {
  const res = await request('GET', '/api/cart');
  assert.strictEqual(res.status, 401);
});

test('add to cart requires size when product has sizes', async () => {
  const jar = await authedUser('cart1@test.dev');
  const res = await request('POST', '/api/cart/items', { body: { productId: PICK.id, quantity: 1 }, jar });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.json.error.code, 'SIZE_REQUIRED');
});

test('add to cart rejects unknown size and unknown color', async () => {
  const jar = await authedUser('cart2@test.dev');
  const badSize = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'ZZZ', quantity: 1 }, jar });
  assert.strictEqual(badSize.status, 400);
  assert.strictEqual(badSize.json.error.code, 'INVALID_SIZE');
  const badColor = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', color: 'NeonGreen', quantity: 1 }, jar });
  assert.strictEqual(badColor.status, 400);
  assert.strictEqual(badColor.json.error.code, 'INVALID_COLOR');
});

test('add to cart rejects out-of-stock products', async () => {
  const jar = await authedUser('cart3@test.dev');
  const res = await request('POST', '/api/cart/items', { body: { productId: OOS.id, quantity: 1 }, jar });
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.json.error.code, 'OUT_OF_STOCK');
});

test('add to cart rejects invalid quantity', async () => {
  const jar = await authedUser('cart4@test.dev');
  const res = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 99 }, jar });
  assert.strictEqual(res.status, 400);
});

test('server calculates price - client cannot set it', async () => {
  const jar = await authedUser('cart5@test.dev');
  const res = await request('POST', '/api/cart/items', {
    body: { productId: PICK.id, size: 'M', quantity: 2, unitPrice: 1 },
    jar,
  });
  assert.strictEqual(res.status, 201);
  const item = res.json.data.cart.items[0];
  assert.strictEqual(item.unitPrice.cents, PICK.price_cents, 'price comes from the database, not the client');
  assert.strictEqual(res.json.data.cart.subtotal.cents, PICK.price_cents * 2);
  assert.strictEqual(res.json.data.cart.subtotal.currency, 'INR');
  assert.ok(res.json.data.cart.total.cents === res.json.data.cart.subtotal.cents + res.json.data.cart.tax.cents + res.json.data.cart.shipping.cents, 'cart totals math');
});

test('add same variant merges quantity; totals recalc', async () => {
  const jar = await authedUser('cart6@test.dev');
  await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 1 }, jar });
  const again = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 2 }, jar });
  assert.strictEqual(again.json.data.cart.items.length, 1);
  assert.strictEqual(again.json.data.cart.items[0].quantity, 3);
});

test('update and remove cart items', async () => {
  const jar = await authedUser('cart7@test.dev');
  const added = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 1 }, jar });
  const itemId = added.json.data.cart.items[0].id;
  const updated = await request('PATCH', `/api/cart/items/${itemId}`, { body: { quantity: 4 }, jar });
  assert.strictEqual(updated.json.data.cart.items[0].quantity, 4);
  const removed = await request('DELETE', `/api/cart/items/${itemId}`, { jar });
  assert.strictEqual(removed.json.data.cart.items.length, 0);
});

test('clear cart empties it', async () => {
  const jar = await authedUser('cart8@test.dev');
  await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 1 }, jar });
  const cleared = await request('DELETE', '/api/cart', { jar });
  assert.strictEqual(cleared.json.data.cart.items.length, 0);
});

test('cannot touch another user cart item (IDOR)', async () => {
  const jarA = await authedUser('cartA@test.dev');
  const jarB = await authedUser('cartB@test.dev');
  const added = await request('POST', '/api/cart/items', { body: { productId: PICK.id, size: 'M', quantity: 1 }, jar: jarA });
  const itemId = added.json.data.cart.items[0].id;
  const res = await request('PATCH', `/api/cart/items/${itemId}`, { body: { quantity: 5 }, jar: jarB });
  assert.strictEqual(res.status, 404, 'user B cannot update user A item');
});

test('products without sizes can be added without a size', async () => {
  const jar = await authedUser('cart9@test.dev');
  const res = await request('POST', '/api/cart/items', { body: { productId: NO_SIZE.id, quantity: 1 }, jar });
  assert.strictEqual(res.status, 201);
});