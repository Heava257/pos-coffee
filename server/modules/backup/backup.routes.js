const express = require("express");
const router = express.Router();
const c = require("./backup.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Platform Owner Backup APIs
router.get("/", authMiddleware("settings"), c.getBackups);
router.post("/generate", authMiddleware("settings"), c.createBackup);
router.post("/delete", authMiddleware("settings"), c.deleteBackup);
router.get("/download/:filename", authMiddleware("settings"), c.downloadBackup);
router.post("/test-s3", authMiddleware("settings"), c.testS3Connection);

module.exports = router;
