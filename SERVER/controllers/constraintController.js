const { Constraint, Reservable } = require('../models');

/**
 * Create a new constraint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createConstraint = async (req, res) => {
  try {
    const { reservable_id, name, type, value } = req.body;
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
        message: 'You are not authorized to add constraints to this reservable'
      });
    }

    // Check if a constraint with this name already exists for this reservable
    const existingConstraint = await Constraint.findOne({
      where: {
        reservable_id,
        name
      }
    });
    if (existingConstraint) {
      return res.status(409).json({
        success: false,
        message: 'A constraint with this name already exists for this reservable'
      });
    }

    // Create the constraint
    const constraint = await Constraint.create({
      reservable_id,
      name,
      type,
      value
    });

    return res.status(201).json({
      success: true,
      message: 'Constraint created successfully',
      data: {
        constraint
      }
    });
  } catch (error) {
    console.error('Error creating constraint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating constraint'
    });
  }
};

/**
 * Get all constraints for a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservableConstraints = async (req, res) => {
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

    // Get all constraints for the reservable
    const constraints = await Constraint.findAll({
      where: { reservable_id },
      order: [['created_at', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        constraints
      }
    });
  } catch (error) {
    console.error('Error getting reservable constraints:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservable constraints'
    });
  }
};

/**
 * Get a single constraint by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConstraint = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the constraint
    const constraint = await Constraint.findByPk(id);
    if (!constraint) {
      return res.status(404).json({
        success: false,
        message: 'Constraint not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        constraint
      }
    });
  } catch (error) {
    console.error('Error getting constraint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting constraint'
    });
  }
};

/**
 * Update a constraint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateConstraint = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value } = req.body;
    const userId = req.user.id;

    // Find the constraint
    const constraint = await Constraint.findByPk(id);
    if (!constraint) {
      return res.status(404).json({
        success: false,
        message: 'Constraint not found'
      });
    }

    // Check if user owns the reservable
    const reservable = await Reservable.findByPk(constraint.reservable_id);
    if (!reservable || reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this constraint'
      });
    }

    // Check if name is being changed and if it conflicts with existing constraint
    if (name && name !== constraint.name) {
      const existingConstraint = await Constraint.findOne({
        where: {
          reservable_id: constraint.reservable_id,
          name
        }
      });
      if (existingConstraint) {
        return res.status(409).json({
          success: false,
          message: 'A constraint with this name already exists for this reservable'
        });
      }
    }

    // Update the constraint
    await constraint.update({
      name: name || constraint.name,
      type: type || constraint.type,
      value: value !== undefined ? value : constraint.value
    });

    return res.status(200).json({
      success: true,
      message: 'Constraint updated successfully',
      data: {
        constraint
      }
    });
  } catch (error) {
    console.error('Error updating constraint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating constraint'
    });
  }
};

/**
 * Delete a constraint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteConstraint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the constraint
    const constraint = await Constraint.findByPk(id);
    if (!constraint) {
      return res.status(404).json({
        success: false,
        message: 'Constraint not found'
      });
    }

    // Check if user owns the reservable
    const reservable = await Reservable.findByPk(constraint.reservable_id);
    if (!reservable || reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this constraint'
      });
    }

    // Delete the constraint
    await constraint.destroy();

    return res.status(200).json({
      success: true,
      message: 'Constraint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting constraint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting constraint'
    });
  }
};

module.exports = {
  createConstraint,
  getReservableConstraints,
  getConstraint,
  updateConstraint,
  deleteConstraint
}; 