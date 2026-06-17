const express = require("express");
const router = express.Router();
const c = require("./table.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/tables
router.get("/", authMiddleware("table"), c.getList);
router.post("/", authMiddleware("table"), c.create);
router.put("/status", authMiddleware("table"), c.updateStatus);
router.delete("/", authMiddleware("table"), c.remove);

module.exports = router;
