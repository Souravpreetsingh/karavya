'use strict';

const SENSITIVE_KEYS = /password|passwd|token|cvv|card|secret|api[_-]?key|authorization|otp/i;

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = sanitize(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const current = process.env.LOG_LEVEL || 'info';

function log(level, msg, meta) {
  if (levels[level] < levels[current]) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    meta: sanitize(meta),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

module.exports = {
  debug: (m, meta) => log('debug', m, meta),
  info: (m, meta) => log('info', m, meta),
  warn: (m, meta) => log('warn', m, meta),
  error: (m, meta) => log('error', m, meta),
};