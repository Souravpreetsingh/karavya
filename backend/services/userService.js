'use strict';

const db = require('../db');
const crypto = require('crypto');
const { scryptHash, scryptVerify, randomToken, hashToken } = require('../utils/crypto');
const { AppError } = require('../utils/errors');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const WHATSAPP_EMAIL_DOMAIN = 'whatsapp.karavya.local';

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return raw.startsWith('+') ? `+${digits}` : digits;
}

function isWhatsAppEmail(email) {
  return String(email || '').toLowerCase().endsWith(`@${WHATSAPP_EMAIL_DOMAIN}`);
}

function whatsappEmail(phone) {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return `wa-${digits}@${WHATSAPP_EMAIL_DOMAIN}`;
}

function getSafeUser(row) {
  if (!row) return null;
  const authMethod = isWhatsAppEmail(row.email) ? 'whatsapp' : 'email';
  return {
    id: row.id,
    email: authMethod === 'whatsapp' ? '' : row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    authMethod,
    emailVerified: !!row.email_verified,
    role: row.role,
    preferredSize: row.preferred_size,
    preferredFit: row.preferred_fit,
    styleProfile: row.style_profile_json ? JSON.parse(row.style_profile_json) : null,
    createdAt: row.created_at,
  };
}

const UserService = {
  async create({ email, password, firstName, lastName, phone, role = 'customer', authMethod = 'email' }) {
    const normalizedPhone = normalizePhone(phone);
    const accountEmail = authMethod === 'whatsapp' && !email ? whatsappEmail(normalizedPhone) : String(email || '').toLowerCase();
    if (!accountEmail) throw new AppError(400, 'EMAIL_REQUIRED', 'A valid email is required');

    if (authMethod === 'whatsapp') {
      const existingPhone = db.prepare("SELECT id FROM users WHERE phone = ? AND phone != ''").get(normalizedPhone);
      if (existingPhone) throw new AppError(409, 'PHONE_TAKEN', 'An account with this WhatsApp number already exists');
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(accountEmail);
    if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    const user = {
      id: id(),
      email: accountEmail,
      passwordHash: scryptHash(password),
      firstName: firstName || '',
      lastName: lastName || '',
      phone: normalizedPhone || '',
      role,
    };
    db.prepare(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, email_verified, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)'
    ).run(user.id, user.email, user.passwordHash, user.firstName, user.lastName, user.phone, user.role, now(), now());
    return UserService.findById(user.id);
  },

  findById(id) {
    return getSafeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  },

  async verifyCredentials(identifier, password) {
    const raw = String(identifier || '').trim();
    let row = null;
    if (raw.includes('@')) {
      row = db.prepare('SELECT * FROM users WHERE email = ?').get(raw.toLowerCase());
    }
    if (!row) {
      const normalizedPhone = normalizePhone(raw);
      if (normalizedPhone) row = db.prepare("SELECT * FROM users WHERE phone = ? AND phone != ''").get(normalizedPhone);
    }
    if (!row || !scryptVerify(password, row.password_hash)) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }
    return getSafeUser(row);
  },

  async updateProfile(userId, fields) {
    const allowed = ['firstName', 'lastName', 'phone', 'preferredSize', 'preferredFit', 'styleProfile'];
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'User not found');
    const next = { ...row };
    if (fields.firstName !== undefined) next.first_name = fields.firstName;
    if (fields.lastName !== undefined) next.last_name = fields.lastName;
    if (fields.phone !== undefined) next.phone = fields.phone;
    if (fields.preferredSize !== undefined) next.preferred_size = fields.preferredSize;
    if (fields.preferredFit !== undefined) next.preferred_fit = fields.preferredFit;
    if (fields.styleProfile !== undefined) next.style_profile_json = JSON.stringify(fields.styleProfile);
    db.prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ?, preferred_size = ?, preferred_fit = ?, style_profile_json = ?, updated_at = ? WHERE id = ?')
      .run(next.first_name, next.last_name, next.phone, next.preferred_size, next.preferred_fit, next.style_profile_json, now(), userId);
    return UserService.findById(userId);
  },

  async markEmailVerified(userId) {
    db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').run(now(), userId);
  },

  async createPasswordReset(email) {
    const row = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (!row) return null;
    const token = randomToken(32);
    db.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)')
      .run(id(), row.id, hashToken(token), new Date(Date.now() + 60 * 60 * 1000).toISOString(), now());
    return token;
  },

  async resetPassword(token, newPassword) {
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > ?')
      .get(hashToken(token), now());
    if (!row) throw new AppError(400, 'INVALID_TOKEN', 'This reset link is invalid or has expired');
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(scryptHash(newPassword), now(), row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
  },
};

UserService.normalizePhone = normalizePhone;

module.exports = UserService;
