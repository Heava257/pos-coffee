const express = require("express");
const router = express.Router();
const c = require("./stock.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/stock
router.get("/logs", authMiddleware("stock"), c.getLogs);
router.post("/adjust", authMiddleware("stock/adjust"), c.adjustStock);

module.exports = router;