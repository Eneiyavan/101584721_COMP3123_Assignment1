const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Requires "Authorization: Bearer <jwt>". On success sets req.user from the
 * verified token (never from client-supplied IDs).
 */
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    logger.warn('Auth failed: missing token', { method: req.method, path: req.originalUrl.split('?')[0] });
    throw new AppError('Authentication required. Provide a Bearer token.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    logger.warn(expired ? 'Auth failed: token expired' : 'Auth failed: invalid token', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
    });
    throw new AppError(expired ? 'Token has expired. Please log in again.' : 'Invalid token.', 401);
  }

  const user = await User.findById(payload.id);
  if (!user) {
    logger.warn('Auth failed: token user no longer exists');
    throw new AppError('Invalid token.', 401);
  }

  req.user = user;
  next();
});
