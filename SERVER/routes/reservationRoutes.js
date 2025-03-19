const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservableReservations,
  getUserReservations,
  getReservation
} = require('../controllers/reservationController');
const { validate, reservationValidation, uuidParam } = require('../middlewares/validate');

// Create a new reservation (no authentication required)
router.post('/', validate(reservationValidation), createReservation);

// Get all reservations for a reservable
router.get('/reservable/:reservable_id', getReservableReservations);

// Get all reservations for a user
router.get('/user/:user_id', getUserReservations);

// Get a single reservation by ID
router.get('/:id', validate(uuidParam), getReservation);

module.exports = router; 