const { Reservation, Reservable, User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Create a new reservation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReservation = async (req, res) => {
  try {
    const { 
      reservable_id, 
      start_time_iso8601, 
      end_time_iso8601, 
      notes, 
      constraint_inputs 
    } = req.body;

    const user_id = req.user.id;

    // Check if reservable exists
    const reservable = await Reservable.findByPk(reservable_id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Convert ISO timestamps to standard timestamps
    const start_time_standard = new Date(start_time_iso8601);
    const end_time_standard = new Date(end_time_iso8601);

    // Call the PostgreSQL function to create the reservation
    const [results] = await sequelize.query(`
      SELECT * FROM make_reservation(
        :reservable_id,
        :user_id,
        :start_time_standard,
        :end_time_standard,
        :start_time_iso8601,
        :end_time_iso8601,
        :notes,
        :constraint_inputs::jsonb
      )
    `, {
      replacements: {
        reservable_id,
        user_id,
        start_time_standard,
        end_time_standard,
        start_time_iso8601,
        end_time_iso8601,
        notes: notes || null,
        constraint_inputs: JSON.stringify(constraint_inputs || {})
      }
    });

    // Check the result from the function
    // TODO: Log the results
    console.log(results);
    
    // Get the first row of results
    const result = results[0];
    
    // Check if the operation was successful
    if (result.error_message) {
      return res.status(400).json({
        success: false,
        message: result.error_message || 'Reservation creation failed'
      });
    }

    // If successful, fetch the created reservation
    const reservation = await Reservation.findByPk(result.reservation_id);

    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        reservation,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating reservation'
    });
  }
};

/**
 * Get all reservations for a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservableReservations = async (req, res) => {
  try {
    const { reservable_id } = req.params;

    // Check if reservable exists
    const reservable = await Reservable.findByPk(reservable_id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Get all reservations for the reservable
    const reservations = await Reservation.findAll({
      where: { reservable_id },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        reservations
      }
    });
  } catch (error) {
    console.error('Error getting reservable reservations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservable reservations'
    });
  }
};

/**
 * Get all reservations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserReservations = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all reservations for the user
    const reservations = await Reservation.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        reservations
      }
    });
  } catch (error) {
    console.error('Error getting user reservations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting user reservations'
    });
  }
};

/**
 * Get a single reservation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the reservation
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reservation
      }
    });
  } catch (error) {
    console.error('Error getting reservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservation'
    });
  }
};

/**
 * Delete a reservation by ID
 * Requires authentication and authorization.
 * Authorization rules:
 * 1. The user who created the reservation can delete it if it hasn't ended yet
 * 2. The owner of the associated reservable can delete any reservation (even past ones)
 * 
 * @param {Object} req - Express request object with params.id (UUID) and user object from auth middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success status and message
 */
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the reservation with its associated reservable
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user is the owner of the reservation
    const isReservationOwner = reservation.user_id === userId;
    
    // If not the reservation owner, check if user is the owner of the reservable
    let isReservableOwner = false;
    if (!isReservationOwner) {
      const reservable = await Reservable.findByPk(reservation.reservable_id);
      if (!reservable) {
        return res.status(404).json({
          success: false,
          message: 'Associated reservable not found'
        });
      }
      isReservableOwner = reservable.user_id === userId;
    }

    // User must be either the reservation owner or the reservable owner
    if (!isReservationOwner && !isReservableOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this reservation'
      });
    }

    // Check for reservations that have already happened
    // Only reservation owners are restricted from deleting past reservations
    // Reservable owners (admins) can delete any reservation
    const now = new Date();
    if (isReservationOwner && !isReservableOwner && new Date(reservation.end_time_standard) < now) {
      return res.status(400).json({
        success: false,
        message: 'Users cannot delete reservations that have already ended. Please contact the reservable owner.'
      });
    }

    // Delete the reservation
    await reservation.destroy();

    return res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully',
      data: {
        id: reservation.id,
        was_owner: isReservationOwner,
        was_reservable_owner: isReservableOwner
      }
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting reservation',
      error: error.message
    });
  }
};

module.exports = {
  createReservation,
  getReservableReservations,
  getUserReservations,
  getReservation,
  deleteReservation
}; 