'use strict';

const { AppError } = require('../utils/errors');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] || {});
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request', issues));
    }
    req[`validated${source === 'body' ? '' : source[0].toUpperCase() + source.slice(1)}`] = result.data;
    next();
  };
}

module.exports = { validate };