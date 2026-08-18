'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function hydrate(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country,
    isDefault: !!row.is_default,
  };
}

const AddressService = {
  list(userId) {
    const rows = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId);
    return rows.map(hydrate);
  },

  create(userId, data) {
    const count = db.prepare('SELECT COUNT(*) AS c FROM addresses WHERE user_id = ?').get(userId).c;
    const isDefault = count === 0 ? 1 : data.isDefault ? 1 : 0;
    const aid = id();
    if (isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    db.prepare(`INSERT INTO addresses (id, user_id, label, full_name, phone, line1, line2, city, state, pincode, country, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(aid, userId, data.label || 'Home', data.fullName || '', data.phone || '', data.line1 || '', data.line2 || '',
        data.city || '', data.state || '', data.pincode || '', data.country || 'India', isDefault, now(), now());
    return hydrate(db.prepare('SELECT * FROM addresses WHERE id = ?').get(aid));
  },

  getOwned(userId, addressId) {
    const row = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(addressId, userId);
    if (!row) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    return hydrate(row);
  },

  update(userId, addressId, data) {
    AddressService.getOwned(userId, addressId);
    db.prepare(`UPDATE addresses SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, pincode = ?, country = ?, updated_at = ? WHERE id = ?`)
      .run(data.label ?? '', data.fullName ?? '', data.phone ?? '', data.line1 ?? '', data.line2 ?? '',
        data.city ?? '', data.state ?? '', data.pincode ?? '', data.country ?? 'India', now(), addressId);
    return AddressService.getOwned(userId, addressId);
  },

  remove(userId, addressId) {
    const row = AddressService.getOwned(userId, addressId);
    db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);
    if (row.isDefault) {
      const next = db.prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at LIMIT 1').get(userId);
      if (next) db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(next.id);
    }
  },

  setDefault(userId, addressId) {
    AddressService.getOwned(userId, addressId);
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
      db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(addressId);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  },
};

module.exports = AddressService;