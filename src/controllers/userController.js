const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const signToken = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

// POST /api/v1/user/signup  -> 201
exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing) {
    const field = existing.username === username.toLowerCase() ? 'username' : 'email';
    logger.warn('Signup rejected: duplicate', { field });
    throw new AppError(`A user with that ${field} already exists`, 409);
  }

  const user = await User.create({ username, email, password });
  logger.info('User registered', { userId: String(user._id), username: user.username });

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    user: user.toJSON(),
  });
});

// POST /api/v1/user/login  -> 200 (username OR email + password)
exports.login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const filter = username ? { username: username.toLowerCase() } : { email: email.toLowerCase() };

  const user = await User.findOne(filter).select('+password');
  const ok = user ? await user.comparePassword(password) : false;

  if (!ok) {
    logger.warn('Login failed: invalid credentials', { identifier: username || email });
    // Same message for unknown user and wrong password (prevents user enumeration)
    throw new AppError('Invalid credentials', 401);
  }

  logger.info('Login successful', { userId: String(user._id) });
  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    token: signToken(user),
    user: user.toJSON(),
  });
});
