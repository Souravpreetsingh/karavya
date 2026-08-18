'use strict';

const fs = require('fs');
const path = require('path');

function loadEnvFile(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) return;
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env');

const int = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

const config = {
  port: int(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  databasePath: path.resolve(process.env.DATABASE_PATH || './data/karavya.db'),
  authSecret: process.env.AUTH_SECRET || 'change-me-to-a-long-random-string',
  sessionTtlMs: int(process.env.SESSION_TTL_MS, 7 * 24 * 60 * 60 * 1000),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  shipping: {
    flatCents: int(process.env.SHIPPING_FLAT_CENTS, 50000),
    freeThresholdCents: int(process.env.SHIPPING_FREE_THRESHOLD_CENTS || process.env.FREE_SHIPPING_THRESHOLD_CENTS, 500000),
    taxRate: num(process.env.TAX_RATE, 0.05),
  },
  admin: {
    email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  },
  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    max: int(process.env.RATE_LIMIT_MAX, 120),
    authMax: int(process.env.AUTH_RATE_LIMIT_MAX, 10),
  },
  ai: {
    provider: process.env.AI_PROVIDER || '',
    model: process.env.AI_MODEL || '',
    apiKey: process.env.AI_API_KEY || '',
    endpoint: process.env.AI_ENDPOINT || '',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || '',
    publicKey: process.env.PAYMENT_PUBLIC_KEY || '',
    secret: process.env.PAYMENT_SECRET || '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'KARAVYA Maison <no-reply@karavya.example>',
    host: process.env.EMAIL_HOST || '',
    port: int(process.env.EMAIL_PORT, 587),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
};

module.exports = config;