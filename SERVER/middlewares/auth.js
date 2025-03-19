const { verifyToken } = require('../config/jwt');
const { User } = require('../models');

// Middleware to check if the user is authenticated
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No bearer token provided.' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Token is missing.' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    // Check if user exists in database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User no longer exists.' 
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if the user is the owner of a reservable
const isReservableOwner = async (req, res, next) => {
  try {
    const { reservable_id } = req.params.id ? { id: req.params.id } : req.body;
    
    if (!reservable_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reservable ID is required' 
      });
    }

    // Import Reservable model
    const { Reservable } = require('../models');
    
    // Find the reservable
    const reservable = await Reservable.findByPk(reservable_id);
    if (!reservable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservable not found' 
      });
    }

    // Check if user is the owner
    if (reservable.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to perform this action on this reservable' 
      });
    }

    // Add reservable to request
    req.reservable = reservable;

    next();
  } catch (error) {
    console.error('Reservable owner check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during reservable authorization' 
    });
  }
};

module.exports = { isAuthenticated, isReservableOwner }; 