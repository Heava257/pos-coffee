const express = require("express");
const router = express.Router();
const c = require("./shift.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/shifts
router.post("/", authMiddleware("shift"), c.create); // Used for close
router.post("/open", authMiddleware("shift"), c.openShift);
router.get("/current", authMiddleware("shift"), c.getCurrentShift);
router.get("/summary", authMiddleware("shift"), c.getShiftSummary);
router.get("/", authMiddleware("shift"), c.getList);

module.exports = router;
