const express = require("express");
const router = express.Router();
const c = require("./backup.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("settings"), c.getBackups);
router.post("/generate", authMiddleware("settings"), c.createBackup);
router.post("/delete", authMiddleware("settings"), c.deleteBackup);
router.get("/download/:filename", authMiddleware("settings"), c.downloadBackup);
router.post("/test-s3", authMiddleware("settings"), c.testS3Connection);
router.post("/restore", authMiddleware("settings"), c.restoreBackup);

module.exports = router;
