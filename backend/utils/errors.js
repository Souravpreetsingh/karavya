'use strict';

const logger = require('./logger');

class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }
  const status = err.status || 500;
  if (status >= 500) logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  const code = status >= 500 ? 'INTERNAL_ERROR' : err.code || 'ERROR';
  const message = status >= 500 ? 'Something went wrong' : err.message;
  res.status(status).json({ success: false, error: { code, message } });
}

module.exports = { AppError, notFound, errorHandler };