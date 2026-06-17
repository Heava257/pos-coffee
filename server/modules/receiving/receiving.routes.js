const express = require("express");
const router = express.Router();
const c = require("./receiving.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/receiving
router.post("/", authMiddleware("purchase"), c.receive);

module.exports = router;