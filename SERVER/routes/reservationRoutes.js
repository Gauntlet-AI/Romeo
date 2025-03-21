const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservableReservations,
  getUserReservations,
  getReservation,
  deleteReservation
} = require('../controllers/reservationController');
const { validate, reservationValidation, uuidParam } = require('../middlewares/validate');
const { isAuthenticated } = require('../middlewares/auth');

// All routes require authentication
router.use(isAuthenticated);

// Create a new reservation (no authentication required)
router.post('/', validate(reservationValidation), createReservation);

// Get all reservations for a reservable
router.get('/reservable/:reservable_id', getReservableReservations);

// Get all reservations for a user
router.get('/user', getUserReservations);

// Get a single reservation by ID
router.get('/:id', validate(uuidParam), getReservation);

// Delete a reservation by ID
router.delete('/:id', validate(uuidParam), deleteReservation);

module.exports = router; 