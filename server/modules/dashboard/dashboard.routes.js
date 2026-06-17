const express = require("express");
const router = express.Router();
const c = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/morning-briefing", authMiddleware(), c.getMorningBriefing);
router.get("/admin", authMiddleware(), c.getAdminDashboard);
router.get("/", authMiddleware(), c.getList);

module.exports = router;
