const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Runs after express-validator chains; returns 400 with field-level details.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  logger.warn('Validation failed', {
    method: req.method,
    path: req.originalUrl.split('?')[0],
    fields: errors.map((e) => e.field),
  });
  return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
};
