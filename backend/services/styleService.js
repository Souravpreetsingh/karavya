'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const ARCHETYPES = {
  muse: { key: 'muse', label: 'The Romantic Muse', description: 'Soft, serene and quietly romantic.' },
  golden: { key: 'golden', label: 'The Golden Hour', description: 'Warm, glamorous and golden-toned.' },
  quiet: { key: 'quiet', label: 'The Quiet Luxe', description: 'Understated, minimal and considered.' },
  playful: { key: 'playful', label: 'The Sunday Muse', description: 'Playful, easy and sunday-morning relaxed.' },
};

function computeArchetype(answers) {
  const counts = {};
  for (const [q, v] of Object.entries(answers || {})) {
    const key = String(v).toLowerCase();
    if (ARCHETYPES[key]) counts[key] = (counts[key] || 0) + 1;
  }
  let best = 'quiet';
  let bestCount = 0;
  for (const [key, n] of Object.entries(counts)) {
    if (n > bestCount) { best = key; bestCount = n; }
  }
  return best;
}

const StyleService = {
  get(userId) {
    const row = db.prepare('SELECT * FROM style_profiles WHERE user_id = ?').get(userId);
    if (!row) return null;
    return {
      answers: JSON.parse(row.answers_json || '{}'),
      archetype: ARCHETYPES[row.style_archetype] || { key: row.style_archetype, label: row.style_archetype },
      quizVersion: row.quiz_version,
      completedAt: row.completed_at,
    };
  },

  save(userId, { answers, archetype, quizVersion = 'v1' }) {
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      throw new AppError(400, 'INVALID_ANSWERS', 'Quiz answers are required');
    }
    const resolvedArchetype = archetype && ARCHETYPES[archetype] ? archetype : computeArchetype(answers);
    const existing = db.prepare('SELECT id FROM style_profiles WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE style_profiles SET answers_json = ?, style_archetype = ?, quiz_version = ?, completed_at = ? WHERE user_id = ?')
        .run(JSON.stringify(answers), resolvedArchetype, quizVersion, now(), userId);
    } else {
      db.prepare('INSERT INTO style_profiles (id, user_id, answers_json, style_archetype, quiz_version, completed_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id(), userId, JSON.stringify(answers), resolvedArchetype, quizVersion, now());
    }
    const profile = StyleService.get(userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (user) {
      db.prepare('UPDATE users SET style_profile_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify({ archetype: profile.archetype.key, answers: profile.answers }), now(), userId);
    }
    return profile;
  },
};

module.exports = StyleService;
module.exports.ARCHETYPES = ARCHETYPES;