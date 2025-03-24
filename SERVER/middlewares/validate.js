const { body, param, query, validationResult } = require('express-validator');
const { isUUID } = require('validator');
const User = require('../models/User');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    next();
  };
};

const loginEmailValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
];

const userValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom((value) => {
      return User.findOne({ where: { email: value } }).then((user) => {
        if (user) {
          return Promise.reject('Email already in use');
        }
        return true;
      });
    })
];

const reservableValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters')
];

const reservableCollectionValidation = [
  body('parent_id')
    .notEmpty()
    .withMessage('Parent ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('Parent ID must be a valid UUID');
      }
      return true;
    }),
  body('child_id')
    .notEmpty()
    .withMessage('Child ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('Child ID must be a valid UUID');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value === req.body.parent_id) {
        throw new Error('Parent and child cannot be the same');
      }
      return true;
    })
];

const constraintValidation = [
  body('reservable_id')
    .notEmpty()
    .withMessage('Reservable ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('Reservable ID must be a valid UUID');
      }
      return true;
    }),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['date', 'time', 'integer', 'string', 'boolean', 'email', 'phone'])
    .withMessage('Type must be one of: date, time, integer, string, boolean, email, phone'),
  body('value')
    .notEmpty()
    .withMessage('Value is required')
];

const constraintUpdateValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['date', 'time', 'integer', 'string', 'boolean', 'email', 'phone'])
    .withMessage('Type must be one of: date, time, integer, string, boolean, email, phone'),
  body('value')
    .notEmpty()
    .withMessage('Value is required')
];

const validatorValidation = [
  body('reservable_id')
    .notEmpty()
    .withMessage('Reservable ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('Reservable ID must be a valid UUID');
      }
      return true;
    }),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
];

const reservationValidation = [
  body('reservable_id')
    .notEmpty()
    .withMessage('Reservable ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('Reservable ID must be a valid UUID');
      }
      return true;
    }),
  body('start_time_iso8601')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be in ISO8601 format'),
  body('end_time_iso8601')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be in ISO8601 format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_time_iso8601)) {
        throw new Error('End time must be after start time');
      }
      return true;
    })
];

const uuidParam = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .custom(value => {
      if (!isUUID(value)) {
        throw new Error('ID must be a valid UUID');
      }
      return true;
    })
];

/**
 * Validation for time range query parameters
 * Both start_time and end_time are optional, but if provided,
 * they must be in ISO8601 format and end_time must be after start_time
 */
const timeRangeQueryValidation = [
  query('start_time')
    .optional()
    .isISO8601()
    .withMessage('Start time must be in ISO8601 format'),
  query('end_time')
    .optional()
    .isISO8601()
    .withMessage('End time must be in ISO8601 format')
    .custom((value, { req }) => {
      // Only validate if both start_time and end_time are provided
      if (value && req.query.start_time) {
        const endTime = new Date(value);
        const startTime = new Date(req.query.start_time);
        if (endTime <= startTime) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    })
];

module.exports = {
  validate,
  loginEmailValidation,
  userValidation,
  reservableValidation,
  reservableCollectionValidation,
  constraintValidation,
  constraintUpdateValidation,
  validatorValidation,
  reservationValidation,
  uuidParam,
  timeRangeQueryValidation
}; 