const express = require('express');
const controller = require('../controllers/empController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRules, updateRules, getByIdRules, deleteRules } = require('../validators/empValidators');

const router = express.Router();

// Every employee route requires a valid JWT
router.use(auth);

router.get('/employees', controller.getAll);
router.post('/employees', createRules, validate, controller.create);
router.get('/employees/:eid', getByIdRules, validate, controller.getById);
router.put('/employees/:eid', updateRules, validate, controller.update);
router.delete('/employees', deleteRules, validate, controller.remove);

module.exports = router;
