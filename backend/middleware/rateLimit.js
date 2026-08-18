'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

function ipKey(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function apiLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: ipKey,
    handler: (req, res) =>
      res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } }),
  });
}

function authLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.authMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKey(req)}:auth`,
    handler: (req, res) =>
      res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' } }),
  });
}

module.exports = { apiLimiter, authLimiter };