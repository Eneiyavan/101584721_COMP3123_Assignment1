const { body } = require('express-validator');

const signupRules = [
  body('username')
    .exists({ values: 'falsy' }).withMessage('Username is required').bail()
    .isString().withMessage('Username must be a string').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may contain only letters, numbers and underscores'),
  body('email')
    .exists({ values: 'falsy' }).withMessage('Email is required').bail()
    .isString().withMessage('Email must be a string').bail()
    .trim()
    .isEmail().withMessage('Email must be a valid email address')
    .isLength({ max: 254 }).withMessage('Email is too long')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string').bail()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginRules = [
  body('username').optional().isString().withMessage('Username must be a string').trim(),
  body('email').optional().isString().withMessage('Email must be a string').trim(),
  body().custom((value, { req }) => {
    if (!req.body.username && !req.body.email) {
      throw new Error('Either username or email is required');
    }
    return true;
  }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string'),
];

module.exports = { signupRules, loginRules };
