'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/schemas');
const db = require('../db');
const ProductService = require('../services/productService');
const { ok, page, parsePagination } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, slug, name, description, image_url, sort_order FROM collections WHERE published = 1 ORDER BY sort_order').all();
  return ok(res, { items: rows });
});

router.get('/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    const row = db.prepare('SELECT id, slug, name, description, image_url FROM collections WHERE id = ? AND published = 1').get(req.params.id);
    if (!row) throw new AppError(404, 'COLLECTION_NOT_FOUND', 'Collection not found');
    return ok(res, { collection: row });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/products', validate(idParam, 'params'), (req, res, next) => {
  try {
    const row = db.prepare('SELECT id FROM collections WHERE id = ?').get(req.params.id);
    if (!row) throw new AppError(404, 'COLLECTION_NOT_FOUND', 'Collection not found');
    const { limit, offset } = parsePagination(req.query);
    const result = ProductService.byCollection(req.params.id, { limit, offset });
    return ok(res, page(result.items, result.total, limit, offset));
  } catch (err) {
    next(err);
  }
});

module.exports = router;