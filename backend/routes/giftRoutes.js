'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { giftPreferenceSchema } = require('../validators/schemas');
const GiftService = require('../services/giftService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/gift-preferences', (req, res) => ok(res, { preferences: GiftService.get(req.session.userId) }));

router.post('/gift-preferences', validate(giftPreferenceSchema), (req, res, next) => {
  try {
    return ok(res, { preferences: GiftService.save(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/gift-preferences', validate(giftPreferenceSchema), (req, res, next) => {
  try {
    return ok(res, { preferences: GiftService.save(req.session.userId, req.validated) });
  } catch (err) {
    next(err);
  }
});

router.get('/gift-recommendations', (req, res, next) => {
  try {
    const budgetMax = req.query.budgetMax !== undefined ? Number(req.query.budgetMax) : null;
    if (budgetMax !== null && (!Number.isFinite(budgetMax) || budgetMax < 0)) {
      const { AppError } = require('../utils/errors');
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid budgetMax');
    }
    const items = GiftService.recommend(req.session.userId, {
      budgetMax,
      limit: Math.min(Number(req.query.limit) || 6, 12),
    });
    return ok(res, { items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;