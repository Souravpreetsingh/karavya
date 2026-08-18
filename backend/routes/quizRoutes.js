'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { styleProfileSchema } = require('../validators/schemas');
const StyleService = require('../services/styleService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/style-profile', (req, res) => ok(res, { profile: StyleService.get(req.session.userId) }));

router.post('/style-profile', validate(styleProfileSchema), (req, res, next) => {
  try {
    return ok(res, { profile: StyleService.save(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/style-profile', validate(styleProfileSchema), (req, res, next) => {
  try {
    return ok(res, { profile: StyleService.save(req.session.userId, req.validated) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;