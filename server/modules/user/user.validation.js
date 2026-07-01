/**
 * User Module Validation Rules — M-1 & L-3 FIX
 * Validates inputs for staff creation and updating.
 */
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validate = (rules) => [...rules, handleValidation];

exports.registerRules = validate([
  body('username')
    .isEmail().withMessage('Username must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .optional({ checkFalsy: true }) // Optional on update, required on create handled in controller
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
  body('name')
    .isString().trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 255 }),
  body('pin_code')
    .optional({ checkFalsy: true })
    .isString()
    .matches(/^\d{4,6}$/).withMessage('PIN must be 4–6 digits.'),
  body('role_id')
    .isInt().withMessage('Role ID must be an integer.'),
  body('branch_id')
    .isInt().withMessage('Branch ID must be an integer.'),
]);