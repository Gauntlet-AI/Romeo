const { User } = require('../models');
const { generateToken } = require('../config/jwt');
const crypto = require('crypto');
const { Resend } = require('resend');
const { verifyToken } = require('../config/jwt');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Store login tokens temporarily (in production, use Redis or a database)
const loginTokens = new Map();

/**
 * Request login email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestLoginEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate a unique token for this login request
    const loginToken = crypto.randomBytes(32).toString('hex');
    
    // Store token with user information (expires in 15 minutes)
    loginTokens.set(loginToken, {
      userId: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });
    
    // Create login link
    const loginLink = `${process.env.FRONTEND_URL}/auth/verify?token=${loginToken}`;
    
    // Send email with login link
    await sendLoginEmail(user.email, user.name, loginLink);

    return res.status(200).json({
      success: true,
      message: 'Login email sent successfully'
    });
  } catch (error) {
    console.error('Error requesting login email:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while requesting login email'
    });
  }
};

/**
 * Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyJWTToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: decoded
      }
    });
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying JWT token'
    });
  }
};

/**
 * Verify login token and issue JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyLoginToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Check if token exists and is valid
    if (!loginTokens.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const tokenData = loginTokens.get(token);
    
    // Check if token has expired
    if (tokenData.expires < Date.now()) {
      loginTokens.delete(token);
      return res.status(401).json({
        success: false,
        message: 'Login link has expired'
      });
    }

    // Get user from database to ensure it still exists
    const user = await User.findByPk(tokenData.userId);
    if (!user) {
      loginTokens.delete(token);
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Update user status to 'approved' if it's currently 'pending'
    if (user.status === 'pending') {
      await user.update({ 
        status: 'approved',
        updated_at: new Date() 
      });
    }
    
    // Refresh the user data after update
    await user.reload();

    // Generate JWT token
    const jwtToken = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status // This will now be 'approved'
    });

    // Remove the login token as it's been used
    loginTokens.delete(token);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status
        },
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Error verifying login token:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying login token'
    });
  }
};

/**
 * Send login email with magic link using Resend API
 * @param {String} email - User's email
 * @param {String} name - User's name
 * @param {String} loginLink - Login link with token
 */
const sendLoginEmail = async (email, name, loginLink) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Log in to Romeo App',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello, ${name}!</h2>
        <p>You requested to log in to your Romeo App account.</p>
        <p>Click the button below to log in. This link will expire in 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">
            Log In to Romeo App
          </a>
        </div>
        <p>If you didn't request this login link, you can safely ignore this email.</p>
        <p>Best regards,<br>The Romeo App Team</p>
      </div>
    `
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      throw new Error('Failed to send login email');
    }

    return data;
  } catch (error) {
    console.error('Error in sendLoginEmail:', error);
    throw error;
  }
};

module.exports = {
  requestLoginEmail,
  verifyLoginToken,
  verifyJWTToken
}; 