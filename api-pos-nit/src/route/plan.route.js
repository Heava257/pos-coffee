const authMiddleware = require("../middleware/auth.middleware");
const { getAllPlans, updatePlan, getBusinessPlan, getSystemSubscriptions, updateSystemSubscription, selfUpgrade, getBillingHistory, sendManualReminder } = require("../controller/plan.controller");

module.exports = (app) => {
    app.get("/api/plans", authMiddleware(), getAllPlans);
    app.get("/api/my-plan", authMiddleware(), getBusinessPlan);
    app.get("/api/my-plan/billing-history", authMiddleware("my-plan"), getBillingHistory);
    app.get("/api/system-subscriptions", authMiddleware(), getSystemSubscriptions);
    app.put("/api/system-subscriptions", authMiddleware(), updateSystemSubscription);
    app.post("/api/system-subscriptions/send-reminder", authMiddleware(), sendManualReminder);
    app.put("/api/plans", authMiddleware(), updatePlan);
    app.post("/api/my-plan/upgrade", authMiddleware("my-plan"), selfUpgrade);
};
