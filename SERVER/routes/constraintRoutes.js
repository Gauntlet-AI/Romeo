const express = require('express');
const router = express.Router();
const {
  createConstraint,
  getReservableConstraints,
  getConstraint,
  updateConstraint,
  deleteConstraint
} = require('../controllers/constraintController');
const { isAuthenticated } = require('../middlewares/auth');
const { validate, constraintValidation, constraintUpdateValidation, uuidParam } = require('../middlewares/validate');

// All routes require authentication
router.use(isAuthenticated);

// Create a new constraint
router.post('/', validate(constraintValidation), createConstraint);

// Get all constraints for a reservable
router.get('/reservable/:reservable_id', getReservableConstraints);

// Get a single constraint by ID
router.get('/:id', validate(uuidParam), getConstraint);

// Update a constraint
router.put('/:id', validate([...uuidParam, ...constraintUpdateValidation]), updateConstraint);

// Delete a constraint
router.delete('/:id', validate(uuidParam), deleteConstraint);

module.exports = router; 