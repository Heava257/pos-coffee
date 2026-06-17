const express = require("express");
const router = express.Router();
const c = require("./billing.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/history", authMiddleware(), c.getBillingHistory || ((req, res) => res.json({ list: [] })));

module.exports = router;