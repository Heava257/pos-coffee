const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  getPerformance,
  create,
  update,
  remove,
} = require("../controller/employee.controller");

module.exports = (app) => {
  app.get("/api/employee", authMiddleware(), getList);
  app.get("/api/employee-performance", authMiddleware(), getPerformance);
  app.get("/api/employee_performance", authMiddleware(), getPerformance);
  app.post("/api/employee", authMiddleware(), create);
  app.put("/api/employee", authMiddleware(), update);
  app.delete("/api/employee", authMiddleware(), remove);
};
