'use strict';

const { AppError } = require('../utils/errors');
const UserService = require('../services/userService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue'));
  }
  next();
}

function loadUser(req, res, next) {
  const user = UserService.findById(req.session.userId);
  if (!user) return next(new AppError(401, 'UNAUTHENTICATED', 'Session is no longer valid'));
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { requireAuth, loadUser, requireRole };