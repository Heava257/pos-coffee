const authMiddleware = require("../middleware/auth.middleware");
const business = require("../controller/business.controller");

module.exports = (app) => {
    app.get("/api/business", authMiddleware(), business.getList);
    app.get("/api/business/insights", authMiddleware(), business.getInsights);
    app.get("/api/business/public-config", business.getPublicConfig);
    app.get("/api/business/smtp-health", authMiddleware(), business.getSMTPHealth);
    app.post("/api/business", authMiddleware(), business.create);
    app.put("/api/business", authMiddleware(), business.update);
    app.put("/api/business/status", authMiddleware(), business.updateStatus);
    app.put("/api/business/plan", authMiddleware(), business.updatePlan);
};
