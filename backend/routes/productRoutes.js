'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/schemas');
const ProductService = require('../services/productService');
const { ok, page, parsePagination } = require('../utils/apiResponse');

const router = express.Router();

const SEARCH_SCHEMA = {
  safeParse: (q) => {
    const issues = [];
    if (q.limit !== undefined && (!Number.isInteger(Number(q.limit)) || Number(q.limit) < 1)) {
      issues.push({ path: ['limit'], message: 'limit must be a positive integer' });
    }
    if (q.offset !== undefined && (!Number.isInteger(Number(q.offset)) || Number(q.offset) < 0)) {
      issues.push({ path: ['offset'], message: 'offset must be a non-negative integer' });
    }
    if (q.minPrice !== undefined && !Number.isFinite(Number(q.minPrice))) {
      issues.push({ path: ['minPrice'], message: 'minPrice must be a number' });
    }
    if (q.maxPrice !== undefined && !Number.isFinite(Number(q.maxPrice))) {
      issues.push({ path: ['maxPrice'], message: 'maxPrice must be a number' });
    }
    return issues.length ? { success: false, error: { issues } } : { success: true, data: {} };
  },
};

router.get('/', (req, res, next) => {
  try {
    const check = SEARCH_SCHEMA.safeParse(req.query);
    if (!check.success) {
      const { AppError } = require('../utils/errors');
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query', check.error.issues);
    }
    const { limit, offset } = parsePagination(req.query);
    const result = ProductService.list({
      limit,
      offset,
      q: req.query.q || undefined,
      category: req.query.category || undefined,
      collectionId: req.query.collection || undefined,
      minPriceCents: req.query.minPrice !== undefined ? Math.round(Number(req.query.minPrice) * 100) : undefined,
      maxPriceCents: req.query.maxPrice !== undefined ? Math.round(Number(req.query.maxPrice) * 100) : undefined,
      color: req.query.color || undefined,
      size: req.query.size || undefined,
      availability: req.query.availability || undefined,
      sort: req.query.sort || undefined,
    });
    return ok(res, page(result.items, result.total, limit, offset));
  } catch (err) {
    next(err);
  }
});

router.get('/search', (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const result = ProductService.list({ limit, offset, q: req.query.q || '' });
    return ok(res, page(result.items, result.total, limit, offset));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/related', validate(idParam, 'params'), (req, res) => {
  return ok(res, { items: ProductService.related(req.params.id) });
});

router.get('/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    const product = ProductService.findById(req.params.id);
    if (!product) {
      const { AppError } = require('../utils/errors');
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    return ok(res, { product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;