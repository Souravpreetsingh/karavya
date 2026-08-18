'use strict';

process.env.DATABASE_PATH = './data/test.db';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.RATE_LIMIT_MAX = '5000';

const crypto = require('crypto');
const createApp = require('../app');
const db = require('../db');
const UserService = require('../services/userService');
const { seed } = require('../scripts/seed');

let server = null;
let baseUrl = '';

function cookieJar() {
  let cookie = '';
  return {
    get: () => cookie,
    set(res) {
      const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
      for (const sc of setCookies) {
        const parts = sc.split(';')[0];
        if (parts.startsWith('kaya.sid=')) cookie = parts;
      }
    },
  };
}

async function request(method, path, { body, jar, headers = {}, origin = 'http://localhost:3000' } = {}) {
  const opts = {
    method,
    headers: { ...headers, origin },
    redirect: 'manual',
  };
  if (body !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (jar && jar.get()) opts.headers.cookie = jar.get();
  const res = await fetch(baseUrl + path, opts);
  if (jar) jar.set(res);
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, json, headers: res.headers };
}

async function registerUser(email, password = 'Testpass123', extra = {}) {
  const jar = cookieJar();
  const res = await request('POST', '/api/auth/register', {
    body: { firstName: 'Tester', lastName: 'User', email, password, ...extra },
    jar,
  });
  return { jar, res };
}

async function seedAdmin() {
  const email = `admin-${crypto.randomBytes(4).toString('hex')}@karavya.test`;
  const user = await UserService.create({ email, password: 'Adminpass123', firstName: 'Admin', role: 'admin' });
  return { email, password: 'Adminpass123', id: user.id };
}

async function start() {
  if (server) return baseUrl;
  const { app } = createApp();
  seed();
  await new Promise((resolve) => {
    server = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
}

async function stop() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
}

async function cleanDb() {
  db.exec(`DELETE FROM return_requests; DELETE FROM order_items; DELETE FROM orders; DELETE FROM addresses;
    DELETE FROM gift_preferences; DELETE FROM fit_profiles; DELETE FROM style_profiles; DELETE FROM wishlist_items;
    DELETE FROM wishlists; DELETE FROM cart_items; DELETE FROM carts; DELETE FROM password_reset_tokens;
    DELETE FROM users WHERE role != 'admin';`);
}

module.exports = { start, stop, request, cookieJar, registerUser, seedAdmin, cleanDb, db };