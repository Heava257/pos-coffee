const express = require("express");
const router = express.Router();
const c = require("./membership.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/tiers", authMiddleware(), c.getMembershipTiers);
router.post("/tiers", authMiddleware(), c.createMembershipTier);
router.put("/tiers", authMiddleware(), c.updateMembershipTier);

module.exports = router;