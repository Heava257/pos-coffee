const express = require("express");
const router = express.Router();
const c = require("./membership.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/tiers", authMiddleware("membership"), c.getMembershipTiers);
router.post("/tiers", authMiddleware("membership"), c.createMembershipTier);
router.put("/tiers", authMiddleware("membership"), c.updateMembershipTier);

module.exports = router;