'use strict';

const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function scryptHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function scryptVerify(password, stored) {
  try {
    const [algo, saltHex, hashHex] = String(stored).split('$');
    if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
    const hash = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN, SCRYPT_OPTS);
    return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
  } catch {
    return false;
  }
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { scryptHash, scryptVerify, randomToken, hashToken };