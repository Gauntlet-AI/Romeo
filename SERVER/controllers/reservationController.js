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
      user_id, 
      start_time_iso8601, 
      end_time_iso8601, 
      notes, 
      constraint_inputs 
    } = req.body;

    // Check if reservable exists
    const reservable = await Reservable.findByPk(reservable_id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert ISO timestamps to standard timestamps
    const start_time_standard = new Date(start_time_iso8601);
    const end_time_standard = new Date(end_time_iso8601);

    // Call the PostgreSQL stored procedure to create the reservation
    const [result] = await sequelize.query(`
      CALL create_reservation(
        :reservable_id,
        :user_id,
        :start_time_standard,
        :end_time_standard,
        :start_time_iso8601,
        :end_time_iso8601,
        :notes,
        :constraint_inputs
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

    // Check the result from the stored procedure
    if (result.p_error_message) {
      return res.status(400).json({
        success: false,
        message: result.p_error_message
      });
    }

    // If successful, fetch the created reservation
    const reservation = await Reservation.findByPk(result.p_reservation_id);

    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        reservation,
        status: result.p_status
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
    const { user_id } = req.params;

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

module.exports = {
  createReservation,
  getReservableReservations,
  getUserReservations,
  getReservation
}; 