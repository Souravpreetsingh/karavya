'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { fitProfileSchema } = require('../validators/schemas');
const FitService = require('../services/fitService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/fit-profile', (req, res) => ok(res, { profile: FitService.get(req.session.userId) }));

router.post('/fit-profile', validate(fitProfileSchema), (req, res, next) => {
  try {
    return ok(res, { profile: FitService.upsert(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/fit-profile', validate(fitProfileSchema), (req, res, next) => {
  try {
    return ok(res, { profile: FitService.upsert(req.session.userId, req.validated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/fit-profile', (req, res, next) => {
  try {
    FitService.remove(req.session.userId);
    return ok(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;