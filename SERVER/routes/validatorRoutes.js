const express = require('express');
const router = express.Router();
const {
  createValidator,
  getReservableValidators,
  getValidator,
  toggleValidatorStatus,
  deleteValidator
} = require('../controllers/validatorController');
const { isAuthenticated } = require('../middlewares/auth');
const { validate, validatorValidation, uuidParam } = require('../middlewares/validate');

// All routes require authentication
router.use(isAuthenticated);

// Create a new validator
router.post('/', validate(validatorValidation), createValidator);

// Get all validators for a reservable
router.get('/reservable/:reservable_id', getReservableValidators);

// Get a single validator by ID
router.get('/:id', validate(uuidParam), getValidator);

// Toggle validator status (activate/deactivate)
router.patch('/:id/status', validate(uuidParam), toggleValidatorStatus);

// Delete a validator
router.delete('/:id', validate(uuidParam), deleteValidator);

module.exports = router; 