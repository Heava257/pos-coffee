const express = require("express");
const router = express.Router();
const c = require("./stock-adjustment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/adjust", authMiddleware("stock"), c.adjustStock);

module.exports = router;