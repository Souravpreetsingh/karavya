'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');
const ProductService = require('./productService');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const GiftService = {
  save(userId, { occasion = '', recipientType = '', budgetMin = null, budgetMax = null, stylePreferences = [] }) {
    if (budgetMin !== null && (budgetMin < 0 || !Number.isFinite(budgetMin))) {
      throw new AppError(400, 'INVALID_BUDGET', 'Invalid budget');
    }
    if (budgetMax !== null && (budgetMax < 0 || !Number.isFinite(budgetMax))) {
      throw new AppError(400, 'INVALID_BUDGET', 'Invalid budget');
    }
    const existing = db.prepare('SELECT id FROM gift_preferences WHERE user_id = ?').get(userId);
    const budgetMinCents = budgetMin !== null ? Math.round(budgetMin * 100) : null;
    const budgetMaxCents = budgetMax !== null ? Math.round(budgetMax * 100) : null;
    if (existing) {
      db.prepare('UPDATE gift_preferences SET occasion = ?, recipient_type = ?, budget_min_cents = ?, budget_max_cents = ?, style_preferences_json = ?, updated_at = ? WHERE user_id = ?')
        .run(occasion, recipientType, budgetMinCents, budgetMaxCents, JSON.stringify(stylePreferences || []), now(), userId);
    } else {
      db.prepare('INSERT INTO gift_preferences (id, user_id, occasion, recipient_type, budget_min_cents, budget_max_cents, style_preferences_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id(), userId, occasion, recipientType, budgetMinCents, budgetMaxCents, JSON.stringify(stylePreferences || []), now(), now());
    }
    return GiftService.get(userId);
  },

  get(userId) {
    const row = db.prepare('SELECT * FROM gift_preferences WHERE user_id = ?').get(userId);
    if (!row) return null;
    return {
      occasion: row.occasion,
      recipientType: row.recipient_type,
      budgetMin: row.budget_min_cents !== null ? row.budget_min_cents / 100 : null,
      budgetMax: row.budget_max_cents !== null ? row.budget_max_cents / 100 : null,
      stylePreferences: JSON.parse(row.style_preferences_json || '[]'),
    };
  },

  recommend(userId, { occasion, recipientType, budgetMax = null, limit = 6 }) {
    const underBudget = (list) => (budgetMax === null ? list : list.filter((p) => p.price.cents <= Math.round(budgetMax * 100)));
    let products = underBudget(ProductService.list({ category: 'Gifting', limit: 50 }).items);
    if (products.length === 0) products = underBudget(ProductService.list({ availability: 'in_stock', limit: 50 }).items);
    return products.slice(0, limit);
  },
};

module.exports = GiftService;