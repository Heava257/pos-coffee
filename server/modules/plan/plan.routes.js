const express = require("express");
const router = express.Router();
const c = require("./plan.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/plans
router.get("/public", c.getAllPlans);
router.get("/", authMiddleware("plans"), c.getAllPlans);
router.put("/", authMiddleware("plans"), c.updatePlan);
router.get("/my-plan", authMiddleware("my-plan"), c.getBusinessPlan);
router.get("/my-plan/billing-history", authMiddleware("my-plan"), c.getBillingHistory);
router.post("/my-plan/upgrade", authMiddleware("my-plan"), c.selfUpgrade);
router.get("/system-subscriptions", authMiddleware("system-subscriptions"), c.getSystemSubscriptions);
router.put("/system-subscriptions", authMiddleware("system-subscriptions"), c.updateSystemSubscription);
router.post("/system-subscriptions/send-reminder", authMiddleware("system-subscriptions"), c.sendManualReminder);

module.exports = router;