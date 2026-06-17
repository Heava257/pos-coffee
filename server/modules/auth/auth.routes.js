const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

// Public routes (relative to /api/v1/auth)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/guest-access", authController.guestAccess);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/google-login", authController.googleLogin);

// Protected routes (relative to /api/v1/auth)
router.post("/login-switch", authMiddleware(), authController.loginByPassword);
router.get("/profile", authMiddleware(), authController.getProfile);
router.put("/profile", authMiddleware(), uploadMiddleware.single("upload_image"), authController.updateProfile);
router.post("/verify-manager", authMiddleware(), authController.verifyManager);

module.exports = router;
