'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { wishlistItemSchema } = require('../validators/schemas');
const WishlistService = require('../services/wishlistService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => ok(res, { wishlist: WishlistService.get(req.session.userId) }));

router.post('/items', validate(wishlistItemSchema), (req, res, next) => {
  try {
    return ok(res, { wishlist: WishlistService.add(req.session.userId, req.validated.productId) }, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:productId', validate(wishlistItemSchema, 'params'), (req, res, next) => {
  try {
    return ok(res, { wishlist: WishlistService.remove(req.session.userId, req.params.productId) });
  } catch (err) {
    next(err);
  }
});

router.post('/toggle', validate(wishlistItemSchema), (req, res, next) => {
  try {
    const saved = WishlistService.toggle(req.session.userId, req.validated.productId).saved;
    return ok(res, { wishlist: { ...WishlistService.get(req.session.userId), saved } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;