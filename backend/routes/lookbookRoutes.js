'use strict';

const express = require('express');
const LookbookService = require('../services/lookbookService');
const { ok } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.get('/', (req, res) => ok(res, { items: LookbookService.list() }));

router.get('/:slug', (req, res, next) => {
  try {
    const lookbook = LookbookService.findBySlug(req.params.slug);
    if (!lookbook) throw new AppError(404, 'LOOKBOOK_NOT_FOUND', 'Lookbook not found');
    return ok(res, { lookbook });
  } catch (err) {
    next(err);
  }
});

module.exports = router;