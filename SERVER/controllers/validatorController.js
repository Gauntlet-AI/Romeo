const { Validator, Reservable } = require('../models');
const { sequelize } = require('../config/database');
const { generateValidatorFunction } = require('../utils/validatorGenerator');

/**
 * Create a new validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createValidator = async (req, res) => {
  try {
    const { reservable_id, description } = req.body;
    const userId = req.user.id;

    // Check if reservable exists and belongs to the user
    const reservable = await Reservable.findByPk(reservable_id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }
    if (reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add validators to this reservable'
      });
    }

    // Generate the validator function using LLM
    const functionName = await generateValidatorFunction(description, reservable_id);

    // Verify the validator function
    // TODO: Log the result of the verification
    await sequelize.query(`
      SELECT verify_validator_function('${functionName}');
    `);

    // Create the validator record
    const validator = await Validator.create({
      reservable_id,
      description,
      validation_function: functionName,
      is_active: true
    });

    return res.status(201).json({
      success: true,
      message: 'Validator created successfully',
      data: {
        validator
      }
    });
  } catch (error) {
    console.error('Error creating validator:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating validator'
    });
  }
};

/**
 * Get all validators for a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservableValidators = async (req, res) => {
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

    // Get all validators for the reservable
    const validators = await Validator.findAll({
      where: { reservable_id },
      order: [['created_at', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        validators
      }
    });
  } catch (error) {
    console.error('Error getting reservable validators:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservable validators'
    });
  }
};

/**
 * Get a single validator by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getValidator = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the validator
    const validator = await Validator.findByPk(id);
    if (!validator) {
      return res.status(404).json({
        success: false,
        message: 'Validator not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        validator
      }
    });
  } catch (error) {
    console.error('Error getting validator:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting validator'
    });
  }
};

/**
 * Toggle a validator's active status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleValidatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const userId = req.user.id;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_active field is required'
      });
    }

    // Find the validator
    const validator = await Validator.findByPk(id);
    if (!validator) {
      return res.status(404).json({
        success: false,
        message: 'Validator not found'
      });
    }

    // Check if user owns the reservable
    const reservable = await Reservable.findByPk(validator.reservable_id);
    if (!reservable || reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this validator'
      });
    }

    // Update the validator's active status
    await validator.update({
      is_active: Boolean(is_active)
    });

    return res.status(200).json({
      success: true,
      message: `Validator ${validator.is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        validator
      }
    });
  } catch (error) {
    console.error('Error updating validator status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating validator status'
    });
  }
};

/**
 * Delete a validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteValidator = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the validator
    const validator = await Validator.findByPk(id);
    if (!validator) {
      return res.status(404).json({
        success: false,
        message: 'Validator not found'
      });
    }

    // Check if user owns the reservable
    const reservable = await Reservable.findByPk(validator.reservable_id);
    if (!reservable || reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this validator'
      });
    }

    // Delete the validator function from the database
    await sequelize.query(`
      DROP FUNCTION IF EXISTS ${validator.validation_function};
    `);

    // Delete the validator record
    await validator.destroy();

    return res.status(200).json({
      success: true,
      message: 'Validator deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting validator:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting validator'
    });
  }
};

module.exports = {
  createValidator,
  getReservableValidators,
  getValidator,
  toggleValidatorStatus,
  deleteValidator
}; 