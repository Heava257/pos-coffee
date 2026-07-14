const express = require("express");
const router = express.Router();
const c = require("./security.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/securities or /api/v1/security
router.get("/logs", authMiddleware("security-logs"), c.getLogs);
router.get("/blocked-ips", authMiddleware("security-logs"), c.getBlockedIps);
router.post("/block-ip", authMiddleware("security-logs"), c.blockIp);
router.post("/unblock-ip", authMiddleware("security-logs"), c.unblockIp);

module.exports = router;
