const express = require('express');
const router = express.Router();
const { createUser, getUserProfile } = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/auth');
const { validate, userValidation } = require('../middlewares/validate');

// Create a new user account
router.post('/', validate(userValidation), createUser);

// Get user profile (requires authentication)
router.get('/profile', isAuthenticated, getUserProfile);

module.exports = router; 