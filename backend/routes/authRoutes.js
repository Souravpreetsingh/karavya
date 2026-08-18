'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth, loadUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/schemas');
const UserService = require('../services/userService');
const CartService = require('../services/cartService');
const WishlistService = require('../services/wishlistService');
const MailService = require('../integrations/mailService');
const { ok } = require('../utils/apiResponse');
const config = require('../config');

const router = express.Router();

function startSession(req, user) {
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.createdAt = new Date().toISOString();
}

function mergeGuestData(userId, guestCart, guestWishlist) {
  if (guestCart && guestCart.length) CartService.mergeGuest(userId, guestCart);
  if (guestWishlist && guestWishlist.length) WishlistService.mergeGuest(userId, guestWishlist);
}

router.post('/register', authLimiter(), validate(registerSchema), async (req, res, next) => {
  try {
    const d = req.validated;
    const user = await UserService.create(d);
    startSession(req, user);
    mergeGuestData(user.id, d.guestCart, d.guestWishlist);
    MailService.sendWelcome(user.email, user.firstName);
    return ok(res, { user, cart: CartService.get(user.id), wishlist: WishlistService.get(user.id) }, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter(), validate(loginSchema), async (req, res, next) => {
  try {
    const d = req.validated;
    const user = await UserService.verifyCredentials(d.email, d.password);
    startSession(req, user);
    mergeGuestData(user.id, d.guestCart, d.guestWishlist);
    return ok(res, { user, cart: CartService.get(user.id), wishlist: WishlistService.get(user.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('kaya.sid');
    return ok(res, { loggedOut: true });
  });
});

router.get('/me', requireAuth, loadUser, (req, res) => ok(res, { user: req.user }));

router.post('/forgot-password', authLimiter(), validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const token = await UserService.createPasswordReset(req.validated.email);
    if (token) {
      const link = `${config.frontendUrl}/reset-password?token=${token}`;
      await MailService.sendPasswordReset(req.validated.email, link);
    }
    return ok(res, { sent: true });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', authLimiter(), validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await UserService.resetPassword(req.validated.token, req.validated.newPassword);
    return ok(res, { reset: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;