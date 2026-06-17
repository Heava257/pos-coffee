const express = require("express");
const router = express.Router();
const c = require("./shift.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/shifts
router.post("/", authMiddleware(), c.create); // Used for close
router.post("/open", authMiddleware(), c.openShift);
router.get("/current", authMiddleware(), c.getCurrentShift);
router.get("/summary", authMiddleware(), c.getShiftSummary);
router.get("/", authMiddleware(), c.getList);

module.exports = router;
