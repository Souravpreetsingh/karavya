'use strict';

const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth, loadUser } = require('../middleware/auth');
const { updateProfileSchema } = require('../validators/schemas');
const UserService = require('../services/userService');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(requireAuth, loadUser);

router.get('/me', (req, res) => ok(res, { user: req.user }));

router.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await UserService.updateProfile(req.user.id, req.validated);
    return ok(res, { user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;