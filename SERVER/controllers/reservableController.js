const { Reservable, ReservableCollection } = require('../models');

/**
 * Create a new reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReservable = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Create the reservable
    const reservable = await Reservable.create({
      name,
      description,
      user_id: userId
    });

    return res.status(201).json({
      success: true,
      message: 'Reservable created successfully',
      data: {
        reservable
      }
    });
  } catch (error) {
    console.error('Error creating reservable:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating reservable'
    });
  }
};

/**
 * Get all reservables for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserReservables = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all reservables for the user
    const reservables = await Reservable.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        reservables
      }
    });
  } catch (error) {
    console.error('Error getting user reservables:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting user reservables'
    });
  }
};

/**
 * Get a single reservable by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservable = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the reservable
    const reservable = await Reservable.findByPk(id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reservable
      }
    });
  } catch (error) {
    console.error('Error getting reservable:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservable'
    });
  }
};

/**
 * Update a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateReservable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Find the reservable
    const reservable = await Reservable.findByPk(id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Check if user is the owner
    if (reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this reservable'
      });
    }

    // Update the reservable
    await reservable.update({
      name: name || reservable.name,
      description: description !== undefined ? description : reservable.description
    });

    return res.status(200).json({
      success: true,
      message: 'Reservable updated successfully',
      data: {
        reservable
      }
    });
  } catch (error) {
    console.error('Error updating reservable:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating reservable'
    });
  }
};

/**
 * Delete a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteReservable = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the reservable
    const reservable = await Reservable.findByPk(id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Check if user is the owner
    if (reservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this reservable'
      });
    }

    // Delete the reservable
    await reservable.destroy();

    return res.status(200).json({
      success: true,
      message: 'Reservable deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reservable:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting reservable'
    });
  }
};

/**
 * Add a reservable to a collection (parent-child relationship)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addReservableToCollection = async (req, res) => {
  try {
    const { parent_id, child_id } = req.body;
    const userId = req.user.id;

    // Check if parent reservable exists and belongs to the user
    const parentReservable = await Reservable.findByPk(parent_id);
    if (!parentReservable) {
      return res.status(404).json({
        success: false,
        message: 'Parent reservable not found'
      });
    }
    if (parentReservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this parent reservable'
      });
    }

    // Check if child reservable exists
    const childReservable = await Reservable.findByPk(child_id);
    if (!childReservable) {
      return res.status(404).json({
        success: false,
        message: 'Child reservable not found'
      });
    }

    // Check if the relationship already exists
    const existingRelationship = await ReservableCollection.findOne({
      where: {
        parent_id,
        child_id
      }
    });
    if (existingRelationship) {
      return res.status(409).json({
        success: false,
        message: 'This reservable is already in the collection'
      });
    }

    // Create the relationship
    await ReservableCollection.create({
      parent_id,
      child_id
    });

    return res.status(201).json({
      success: true,
      message: 'Reservable added to collection successfully'
    });
  } catch (error) {
    console.error('Error adding reservable to collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding reservable to collection'
    });
  }
};

/**
 * Remove a reservable from a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeReservableFromCollection = async (req, res) => {
  try {
    const { parent_id, child_id } = req.params;
    const userId = req.user.id;

    // Check if parent reservable exists and belongs to the user
    const parentReservable = await Reservable.findByPk(parent_id);
    if (!parentReservable) {
      return res.status(404).json({
        success: false,
        message: 'Parent reservable not found'
      });
    }
    if (parentReservable.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this parent reservable'
      });
    }

    // Delete the relationship
    const deleted = await ReservableCollection.destroy({
      where: {
        parent_id,
        child_id
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reservable removed from collection successfully'
    });
  } catch (error) {
    console.error('Error removing reservable from collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while removing reservable from collection'
    });
  }
};

/**
 * Get all children of a reservable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservableChildren = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the reservable
    const reservable = await Reservable.findByPk(id);
    if (!reservable) {
      return res.status(404).json({
        success: false,
        message: 'Reservable not found'
      });
    }

    // Get all children
    const children = await reservable.getChildren();

    return res.status(200).json({
      success: true,
      data: {
        children
      }
    });
  } catch (error) {
    console.error('Error getting reservable children:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting reservable children'
    });
  }
};

module.exports = {
  createReservable,
  getUserReservables,
  getReservable,
  updateReservable,
  deleteReservable,
  addReservableToCollection,
  removeReservableFromCollection,
  getReservableChildren
}; 