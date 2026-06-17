const express = require("express");
const router = express.Router();
const c = require("./stock-transfer.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/stock-transfers
router.get("/", authMiddleware(), c.getList);
router.get("/:id", authMiddleware(), c.getDetails);
router.post("/", authMiddleware(), c.create);
router.post("/receive", authMiddleware(), c.receive);
router.post("/cancel", authMiddleware(), c.cancel);

module.exports = router;