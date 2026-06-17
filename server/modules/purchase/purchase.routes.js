const express = require("express");
const router = express.Router();
const c = require("./purchase.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/purchases
router.get("/", authMiddleware(), c.getList);
router.get("/details", authMiddleware(), c.getDetails);
router.post("/", authMiddleware(), c.create);
router.post("/receive", authMiddleware(), c.receive);
router.post("/approve", authMiddleware(), c.approve);
router.delete("/", authMiddleware(), c.remove);

module.exports = router;