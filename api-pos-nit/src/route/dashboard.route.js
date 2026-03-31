const authMiddleware = require("../middleware/auth.middleware");
const { getList, getAdminDashboard } = require("../controller/dashboard.controller");

module.exports = (app) => {
  app.get("/api/dashboard", authMiddleware(), getList);
  app.get("/api/admin-dashboard", authMiddleware(), getAdminDashboard);
};
