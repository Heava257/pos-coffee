/**
 * Auth Input Validation Middleware — M-1 FIX
 * Uses express-validator (already installed in package.json).
 *
 * Rules enforce types, lengths, and sanitization before any business logic runs.
 * L-3 FIX: Password complexity enforced at registration.
 */
const { body, validationResult } = require('express-validator');

/**
 * Reusable validation handler: runs after all validation rules.
 * Returns 400 with structured error array on first failure.
 */
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

/** Helper: wrap rules + handler into a single middleware array */
const validate = (rules) => [...rules, handleValidation];

// ─── Rule Sets ────────────────────────────────────────────────────────────────

/**
 * POST /login
 */
exports.loginRules = validate([
  body('email')
    .isEmail().withMessage('Valid email address required.')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password must be a string.')
    .isLength({ min: 1, max: 128 }).withMessage('Password must be 1–128 characters.'),
]);

/**
 * POST /register  — L-3 FIX: enforce password complexity
 */
exports.registerRules = validate([
  body('email')
    .isEmail().withMessage('Valid email address required.')
    .normalizeEmail()
    .isLength({ max: 255 }),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
  body('business_name')
    .isString().withMessage('Business name is required.')
    .trim()
    .isLength({ min: 1, max: 255 }),
  body('owner_name')
    .isString().withMessage('Owner name is required.')
    .trim()
    .isLength({ min: 1, max: 255 }),
]);

/**
 * POST /forgot-password
 */
exports.forgotPasswordRules = validate([
  body('email')
    .isEmail().withMessage('Valid email address required.')
    .normalizeEmail(),
]);

/**
 * POST /verify-otp
 */
exports.verifyOtpRules = validate([
  body('email').isEmail().normalizeEmail(),
  body('otp')
    .isString()
    .matches(/^\d{6}$/).withMessage('OTP must be exactly 6 digits.'),
]);

/**
 * POST /reset-password
 */
exports.resetPasswordRules = validate([
  body('email').isEmail().normalizeEmail(),
  body('otp')
    .isString()
    .matches(/^\d{6}$/).withMessage('OTP must be exactly 6 digits.'),
  body('new_password')
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters.')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain at least one special character.'),
]);

/**
 * PUT /profile
 */
exports.updateProfileRules = validate([
  body('name').optional().isString().trim().isLength({ max: 255 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('password')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters.'),
  body('pin_code')
    .optional({ checkFalsy: true })
    .isString()
    .matches(/^\d{4,6}$/).withMessage('PIN must be 4–6 digits.'),
]);
