const express = require("express");
const router = express.Router();
const c = require("./plan.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/plans
router.get("/public", c.getAllPlans);
router.get("/", authMiddleware(), c.getAllPlans);
router.put("/", authMiddleware(), c.updatePlan);
router.get("/my-plan", authMiddleware(), c.getBusinessPlan);
router.get("/my-plan/billing-history", authMiddleware(), c.getBillingHistory);
router.post("/my-plan/upgrade", authMiddleware(), c.selfUpgrade);
router.get("/system-subscriptions", authMiddleware(), c.getSystemSubscriptions);
router.put("/system-subscriptions", authMiddleware(), c.updateSystemSubscription);
router.post("/system-subscriptions/send-reminder", authMiddleware(), c.sendManualReminder);

module.exports = router;