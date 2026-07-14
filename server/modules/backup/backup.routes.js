const express = require("express");
const router = express.Router();
const c = require("./backup.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Platform Owner Backup APIs
router.get("/", authMiddleware("settings"), c.getBackups);
router.post("/generate", authMiddleware("settings"), c.createBackup);
router.post("/delete", authMiddleware("settings"), c.deleteBackup);

module.exports = router;
