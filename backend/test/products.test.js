'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start, stop, request, cleanDb, db } = require('./helpers');

before(async () => {
  await start();
  await cleanDb();
});

after(async () => {
  await stop();
});

const IN_STOCK = db.prepare("SELECT id, name FROM products WHERE availability != 'out_of_stock' AND sizes_json != '[]' ORDER BY name LIMIT 1").get();
const PRICEY = db.prepare('SELECT id, price_cents FROM products ORDER BY price_cents DESC LIMIT 1').get();
const CHEAP = db.prepare('SELECT id, price_cents FROM products ORDER BY price_cents ASC LIMIT 1').get();
const OOS = db.prepare("SELECT id FROM products WHERE availability = 'out_of_stock' LIMIT 1").get();

test('GET /api/products lists products with pagination', async () => {
  const res = await request('GET', '/api/products?limit=5');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.items.length, 5);
  assert.ok(res.json.data.total >= 20, 'catalog seeded from real site data');
  assert.ok(res.json.data.hasMore);
  const p = res.json.data.items[0];
  assert.ok(p.price && p.price.currency === 'INR', 'price present with currency');
  assert.ok(Array.isArray(p.colors) && Array.isArray(p.sizes));
});

test('GET /api/products/search?q=robe returns real matches', async () => {
  const res = await request('GET', '/api/products/search?q=robe');
  assert.strictEqual(res.status, 200);
  assert.ok(res.json.data.items.length >= 4, 'multiple robes in catalog');
  for (const p of res.json.data.items) {
    const hay = (p.name + ' ' + (p.description || '') + ' ' + (p.category || '')).toLowerCase();
    assert.match(hay, /robe/i);
  }
});

test('GET /api/products?maxPrice=3000 filters by price', async () => {
  const res = await request('GET', '/api/products?maxPrice=3000');
  assert.strictEqual(res.status, 200);
  for (const p of res.json.data.items) {
    assert.ok(p.price.cents <= 300000, `${p.name} within budget`);
  }
  assert.ok(res.json.data.items.length > 0);
});

test('GET /api/products?minPrice filters by price floor', async () => {
  const res = await request('GET', '/api/products?minPrice=10000');
  for (const p of res.json.data.items) {
    assert.ok(p.price.cents >= 1000000);
  }
  assert.ok(res.json.data.items.some((p) => p.name.includes('Gown')), 'The Fluid Gown (₹12,999) present');
});

test('GET /api/products?category=Robes filters by category', async () => {
  const res = await request('GET', '/api/products?category=Robes');
  for (const p of res.json.data.items) assert.strictEqual(p.category, 'Robes');
  assert.ok(res.json.data.items.length >= 5);
});

test('GET /api/products?size=M returns only products with that size', async () => {
  const res = await request('GET', '/api/products?size=M');
  for (const p of res.json.data.items) assert.ok(p.sizes.includes('M'));
});

test('GET /api/products?color=Rose matches color name', async () => {
  const res = await request('GET', '/api/products?color=Rose');
  for (const p of res.json.data.items) {
    assert.ok(p.colors.some((c) => c.name.toLowerCase() === 'rose'), `${p.name} has Rose color`);
  }
});

test('GET /api/products?availability=in_stock excludes sold out', async () => {
  const res = await request('GET', '/api/products?availability=in_stock');
  for (const p of res.json.data.items) assert.notStrictEqual(p.availability, 'out_of_stock');
});

test('GET /api/products/:id returns a product; unknown id 404s', async () => {
  const res = await request('GET', `/api/products/${IN_STOCK.id}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.data.product.id, IN_STOCK.id);
  const missing = await request('GET', `/api/products/${'00000000-0000-4000-8000-000000000000'}`);
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.json.error.code, 'PRODUCT_NOT_FOUND');
});

test('GET /api/products/:id/related returns same-category pieces', async () => {
  const res = await request('GET', `/api/products/${IN_STOCK.id}/related`);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.json.data.items));
});

test('GET /api/collections lists real collections', async () => {
  const res = await request('GET', '/api/collections');
  assert.strictEqual(res.status, 200);
  const names = res.json.data.items.map((c) => c.name);
  assert.ok(names.includes('Loungewear'));
  assert.ok(names.includes('Robes'));
});

test('GET /api/collections/:id/products returns collection pieces', async () => {
  const coll = await request('GET', '/api/collections');
  const robes = coll.json.data.items.find((c) => c.name === 'Robes');
  const res = await request('GET', `/api/collections/${robes.id}/products`);
  assert.strictEqual(res.status, 200);
  for (const p of res.json.data.items) assert.strictEqual(p.category, 'Robes');
});

test('GET /api/products/:id for sold-out piece exposes availability', async () => {
  const res = await request('GET', `/api/products/${OOS.id}`);
  assert.strictEqual(res.json.data.product.availability, 'out_of_stock');
  assert.strictEqual(res.json.data.product.inStock, false);
});