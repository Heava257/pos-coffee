const express = require("express");
const router = express.Router();
const c = require("./system_settings.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

// Relative to /api/v1/system-settings
router.get("/public", c.getPublicSystemSettings);
router.get("/", authMiddleware("system-settings"), c.getSystemSettings);
router.put("/", authMiddleware("system-settings"), uploadMiddleware.single("khqr_image"), c.updateSystemSettings);

module.exports = router;
