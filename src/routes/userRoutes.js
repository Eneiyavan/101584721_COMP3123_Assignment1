const express = require('express');
const controller = require('../controllers/userController');
const { signupRules, loginRules } = require('../validators/userValidators');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/signup', authLimiter, signupRules, validate, controller.signup);
router.post('/login', authLimiter, loginRules, validate, controller.login);

module.exports = router;
