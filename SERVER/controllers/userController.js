const { User } = require('../models');
const { generateToken } = require('../config/jwt');

/**
 * Create a new user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({ 
      email, 
      name,
      status: 'pending' // Default status
    });

    // Generate JWT token
    const token = generateToken({ 
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status
    });

    // Return success with token
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status
        },
        token
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    // User information is already attached to req by auth middleware
    return res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting user profile'
    });
  }
};

module.exports = {
  createUser,
  getUserProfile
}; 