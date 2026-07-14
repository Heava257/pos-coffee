const express = require("express");
const router = express.Router();
const c = require("./loyalty.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/redeem", authMiddleware("loyalty"), c.redeemStars);
router.get("/history", authMiddleware("loyalty"), c.getRedeemHistory);
router.get("/check-stars", authMiddleware("loyalty"), c.checkStars);

module.exports = router;