const express = require('express');
const router = express.Router();
const { requestLoginEmail, verifyLoginToken, verifyJWTToken } = require('../controllers/authController');
const { validate, loginEmailValidation } = require('../middlewares/validate');

// Request a login email
router.post('/login', validate(loginEmailValidation), requestLoginEmail);

// Verify login token and issue JWT
router.get('/verify', verifyLoginToken);

// Verify JWT token
router.get('/verifyjwt', verifyJWTToken);

module.exports = router; 