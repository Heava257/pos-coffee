const express = require("express");
const router = express.Router();
const c = require("../../src/controller/system_settings.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

// Relative to /api/v1/system-settings
router.get("/public", c.getPublicSystemSettings);
router.get("/", authMiddleware(), c.getSystemSettings);
router.put("/", authMiddleware(), uploadMiddleware.single("khqr_image"), c.updateSystemSettings);

module.exports = router;
