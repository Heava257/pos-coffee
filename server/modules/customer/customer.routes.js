const express = require("express");
const router = express.Router();
const c = require("./customer.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/customers
router.get("/", authMiddleware("customer"), c.getList);
router.get("/inactive", authMiddleware("customer"), c.getInactive);
router.get("/marketing-stats", authMiddleware("customer"), c.getMarketingStats);
router.get("/detail/:id", c.getDetail); // Public for portal

router.post("/public-create", c.publicCreate);
router.post("/send-otp", c.sendOTP);
router.post("/verify-otp", c.verifyOTP);
router.post("/google-login", c.googleLogin);
router.post("/", authMiddleware("customer"), c.create);
router.post("/topup", authMiddleware("customer"), c.topup);
router.post("/send-promo", authMiddleware("customer"), c.sendPromoEmail);
router.post("/redeem", c.redeemReward);

router.put("/public-update", c.publicUpdate);
router.put("/", authMiddleware("customer"), c.update);
router.delete("/", authMiddleware("customer"), c.remove);

module.exports = router;