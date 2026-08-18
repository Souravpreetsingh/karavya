'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { idParam, cartItemSchema, cartItemUpdateSchema } = require('../validators/schemas');
const CartService = require('../services/cartService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => ok(res, { cart: CartService.get(req.session.userId) }));

router.post('/items', validate(cartItemSchema), (req, res, next) => {
  try {
    return ok(res, { cart: CartService.addItem(req.session.userId, req.validated) }, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id', validate(idParam, 'params'), validate(cartItemUpdateSchema), (req, res, next) => {
  try {
    return ok(res, { cart: CartService.updateItem(req.session.userId, req.params.id, req.validated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', validate(idParam, 'params'), (req, res, next) => {
  try {
    return ok(res, { cart: CartService.removeItem(req.session.userId, req.params.id) });
  } catch (err) {
    next(err);
  }
});

router.delete('/', (req, res, next) => {
  try {
    return ok(res, { cart: CartService.clear(req.session.userId) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;