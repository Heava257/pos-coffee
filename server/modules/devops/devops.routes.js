const express = require("express");
const router = express.Router();
const c = require("./devops.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("devops"), c.getMetrics);
router.put("/maintenance", authMiddleware("devops"), c.updateMaintenance);
router.put("/feature-flag", authMiddleware("devops"), c.toggleFeatureFlag);

module.exports = router;
