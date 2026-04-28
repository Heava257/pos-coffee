const authMiddleware = require("../middleware/auth.middleware");
const { getList, getAdminDashboard, getMorningBriefing } = require("../controller/dashboard.controller");

module.exports = (app) => {
  app.get("/api/dashboard", authMiddleware(), getList);
  app.get("/api/dashboard/morning-briefing", authMiddleware(), getMorningBriefing);
  app.get("/api/admin-dashboard", authMiddleware(), getAdminDashboard);
};
