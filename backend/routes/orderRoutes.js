'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth, loadUser, requireRole } = require('../middleware/auth');
const { idParam, orderCreateSchema, orderStatusSchema } = require('../validators/schemas');
const OrderService = require('../services/orderService');
const { ok, page, parsePagination } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const result = OrderService.listForUser(req.session.userId, { limit, offset });
    return ok(res, page(result.items, result.total, limit, offset));
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(orderCreateSchema), async (req, res, next) => {
  try {
    const order = await OrderService.createFromCart(req.session.userId, req.validated);
    return ok(res, { order }, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    const order = OrderService.assertOwner(OrderService.findById(req.params.id), req.session.userId);
    return ok(res, { order });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', loadUser, requireRole('admin'), validate(idParam, 'params'), validate(orderStatusSchema), (req, res, next) => {
  try {
    const order = OrderService.updateStatus(req.params.id, req.validated.status, req.validated);
    return ok(res, { order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;