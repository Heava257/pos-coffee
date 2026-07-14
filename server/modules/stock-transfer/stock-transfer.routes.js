const express = require("express");
const router = express.Router();
const c = require("./stock-transfer.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/stock-transfers
router.get("/", authMiddleware("stock"), c.getList);
router.get("/:id", authMiddleware("stock"), c.getDetails);
router.post("/", authMiddleware("stock"), c.create);
router.post("/receive", authMiddleware("stock"), c.receive);
router.post("/cancel", authMiddleware("stock"), c.cancel);

module.exports = router;