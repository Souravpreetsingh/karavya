'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const FitService = {
  get(userId) {
    const row = db.prepare('SELECT * FROM fit_profiles WHERE user_id = ?').get(userId);
    if (!row) return null;
    return {
      heightCm: row.height_cm,
      weightKg: row.weight_kg,
      sizePreference: row.size_preference,
      measurements: JSON.parse(row.measurements_json || '{}'),
      updatedAt: row.updated_at,
    };
  },

  upsert(userId, { heightCm, weightKg, sizePreference = '', measurements = {} }) {
    const existing = db.prepare('SELECT id FROM fit_profiles WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE fit_profiles SET height_cm = ?, weight_kg = ?, size_preference = ?, measurements_json = ?, updated_at = ? WHERE user_id = ?')
        .run(heightCm ?? null, weightKg ?? null, sizePreference, JSON.stringify(measurements || {}), now(), userId);
    } else {
      db.prepare('INSERT INTO fit_profiles (id, user_id, height_cm, weight_kg, size_preference, measurements_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id(), userId, heightCm ?? null, weightKg ?? null, sizePreference, JSON.stringify(measurements || {}), now(), now());
    }
    return FitService.get(userId);
  },

  remove(userId) {
    db.prepare('DELETE FROM fit_profiles WHERE user_id = ?').run(userId);
  },
};

module.exports = FitService;