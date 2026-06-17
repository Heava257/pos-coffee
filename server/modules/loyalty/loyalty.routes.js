const express = require("express");
const router = express.Router();
const c = require("./loyalty.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/redeem", authMiddleware(), c.redeemStars);
router.get("/history", authMiddleware(), c.getRedeemHistory);
router.get("/check-stars", authMiddleware(), c.checkStars);

module.exports = router;