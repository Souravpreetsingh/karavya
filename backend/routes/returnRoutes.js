'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { idParam, returnCreateSchema } = require('../validators/schemas');
const ReturnService = require('../services/returnService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.get('/policy', (req, res) => ok(res, { policy: ReturnService.policy() }));

router.use(requireAuth);

router.get('/', (req, res) => ok(res, { returns: ReturnService.listForUser(req.session.userId) }));

router.post('/', validate(returnCreateSchema), (req, res, next) => {
  try {
    return ok(res, { returnRequest: ReturnService.create(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    return ok(res, { returnRequest: ReturnService.findById(req.session.userId, req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;