'use strict';

const express = require('express');
const EditorialService = require('../services/editorialService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  return ok(res, EditorialService.list({ limit, offset }));
});

router.get('/search', (req, res) => {
  return ok(res, { items: EditorialService.search(req.query.q || '') });
});

router.get('/:slug', (req, res, next) => {
  try {
    const story = EditorialService.findBySlug(req.params.slug);
    if (!story) {
      const { AppError } = require('../utils/errors');
      throw new AppError(404, 'STORY_NOT_FOUND', 'Story not found');
    }
    return ok(res, { story });
  } catch (err) {
    next(err);
  }
});

module.exports = router;