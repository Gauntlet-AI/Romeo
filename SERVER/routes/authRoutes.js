const express = require('express');
const router = express.Router();
const { requestLoginEmail, verifyLoginToken } = require('../controllers/authController');
const { validate, loginEmailValidation } = require('../middlewares/validate');

// Request a login email
router.post('/login', validate(loginEmailValidation), requestLoginEmail);

// Verify login token and issue JWT
router.get('/verify', verifyLoginToken);

module.exports = router; 