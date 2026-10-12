const AppError = require('../utils/AppError');
const config = require('../config/env');
const logger = require('../utils/logger');

// Unsupported routes
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`, 404));
};

// Central error handler: always responds with JSON, never leaks stack traces
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
  } else if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {}).filter((f) => f !== 'user');
    message = `Duplicate value for: ${fields.join(', ') || 'unique field'}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  if (statusCode >= 500) {
    logger.error('Unhandled error', { method: req.method, path: req.originalUrl.split('?')[0], message: err.message, stack: err.stack });
    message = 'Internal server error'; // hide internals
    errors = undefined;
  } else if (statusCode === 403) {
    logger.warn('Authorization failure', { method: req.method, path: req.originalUrl.split('?')[0], userId: req.user && String(req.user._id) });
  }

  const body = { status: 'error', message };
  if (errors) body.errors = errors;
  if (!config.isProduction && statusCode >= 500) body.debug = err.message;
  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
