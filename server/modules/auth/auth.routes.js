const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const loginRateLimiter = require('../../src/util/loginRateLimiter');

// H-1 FIX: Import validation rules (M-1 fix)
const {
  loginRules,
  registerRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordRules,
  updateProfileRules,
} = require('./auth.validation');

// ─── Public Routes ────────────────────────────────────────────────────────────
// H-1 FIX: loginRateLimiter now applied to ALL auth endpoints that were unprotected.
// M-1 FIX: All endpoints now have input validation middleware.

router.post('/register',       registerRules,       authController.register);
router.post('/login',          loginRateLimiter, loginRules,          authController.login);
router.get( '/guest-access',                         authController.guestAccess);
router.post('/verify-email',                         authController.verifyEmail);
router.post('/google-login',   loginRateLimiter,     authController.googleLogin);

// Password recovery flow — rate limited to prevent OTP brute-force
router.post('/forgot-password', loginRateLimiter, forgotPasswordRules, authController.forgotPassword);
router.post('/verify-otp',      loginRateLimiter, verifyOtpRules,      authController.verifyOtp);
router.post('/reset-password',  loginRateLimiter, resetPasswordRules,  authController.resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.post('/login-switch',  authMiddleware(), loginRateLimiter,              authController.loginByPassword);
router.get( '/profile',       authMiddleware(),                                authController.getProfile);
router.put( '/profile',       authMiddleware(), updateProfileRules, uploadMiddleware.single('upload_image'), authController.updateProfile);
router.post('/verify-manager', authMiddleware(), loginRateLimiter,             authController.verifyManager);

module.exports = router;
