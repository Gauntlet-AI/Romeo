const express = require('express');
const router = express.Router();
const {
  createReservable,
  getUserReservables,
  getReservable,
  updateReservable,
  deleteReservable,
  addReservableToCollection,
  removeReservableFromCollection,
  getReservableChildren
} = require('../controllers/reservableController');
const { isAuthenticated } = require('../middlewares/auth');
const { validate, reservableValidation, reservableCollectionValidation, uuidParam } = require('../middlewares/validate');

// All routes require authentication
router.use(isAuthenticated);

// Create a new reservable
router.post('/', validate(reservableValidation), createReservable);

// Get all reservables for authenticated user
router.get('/user', getUserReservables);

// Get a single reservable by ID
router.get('/:id', validate(uuidParam), getReservable);

// Update a reservable
router.put('/:id', validate([...uuidParam, ...reservableValidation]), updateReservable);

// Delete a reservable
router.delete('/:id', validate(uuidParam), deleteReservable);

// Add a reservable to a collection
router.post('/collection', validate(reservableCollectionValidation), addReservableToCollection);

// Remove a reservable from a collection
router.delete('/collection/:parent_id/:child_id', removeReservableFromCollection);

// Get all children of a reservable
router.get('/:id/children', validate(uuidParam), getReservableChildren);

module.exports = router; 