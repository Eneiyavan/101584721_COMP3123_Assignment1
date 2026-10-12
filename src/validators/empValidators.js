const { body, param, query } = require('express-validator');

const str = (field, label, max, required) => {
  let chain = body(field);
  chain = required
    ? chain.exists({ values: 'falsy' }).withMessage(`${label} is required`).bail()
    : chain.optional();
  return chain
    .isString().withMessage(`${label} must be a string`).bail()
    .trim()
    .notEmpty().withMessage(`${label} cannot be empty`)
    .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);
};

const fields = (required) => [
  str('first_name', 'First name', 50, required),
  str('last_name', 'Last name', 50, required),
  (required ? body('email').exists({ values: 'falsy' }).withMessage('Email is required').bail() : body('email').optional())
    .isString().withMessage('Email must be a string').bail()
    .trim()
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  str('position', 'Position', 100, required),
  (required ? body('salary').exists().withMessage('Salary is required').bail() : body('salary').optional())
    .isFloat({ gt: 0 }).withMessage('Salary must be a positive number').toFloat(),
  (required ? body('date_of_joining').exists({ values: 'falsy' }).withMessage('Date of joining is required').bail() : body('date_of_joining').optional())
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Date of joining must be a valid ISO 8601 date (e.g. 2026-01-31)'),
  str('department', 'Department', 100, required),
];

const objectIdParam = param('eid').isMongoId().withMessage('Invalid employee ID');
const objectIdQuery = query('eid')
  .exists({ values: 'falsy' }).withMessage('Query parameter eid is required').bail()
  .isMongoId().withMessage('Invalid employee ID');

const createRules = fields(true);
const updateRules = [
  objectIdParam,
  ...fields(false),
  body().custom((value, { req }) => {
    const allowed = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];
    if (!allowed.some((k) => req.body && req.body[k] !== undefined)) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
];
const getByIdRules = [objectIdParam];
const deleteRules = [objectIdQuery];

module.exports = { createRules, updateRules, getByIdRules, deleteRules };
