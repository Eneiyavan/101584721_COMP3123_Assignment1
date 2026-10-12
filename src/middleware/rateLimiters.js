const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const logger = require('../utils/logger');

const handler = (label) => (req, res, next, options) => {
  logger.warn('Rate limit exceeded', { limiter: label, method: req.method, path: req.originalUrl.split('?')[0], ip: req.ip });
  res.status(429).json({
    status: 'error',
    message: 'Too many requests. Please try again later.',
  });
};

// Strict limiter for signup/login (brute-force protection)
const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  limit: config.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('auth'),
});

// General limiter for the whole API
const apiLimiter = rateLimit({
  windowMs: config.apiRateLimit.windowMs,
  limit: config.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('api'),
});

module.exports = { authLimiter, apiLimiter };
