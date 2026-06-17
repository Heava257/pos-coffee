const express = require("express");
const router = express.Router();
const c = require("./waste.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/waste
router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("waste"), c.create);

module.exports = router;