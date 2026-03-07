const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  create,
  update,
  remove
} = require("../controller/category.controller");

module.exports = (app) => {
  app.get("/api/category", authMiddleware(), getList);
  app.post("/api/category", authMiddleware(), create);
  app.put("/api/category", authMiddleware(), update);
  app.delete("/api/category", authMiddleware(), remove);
};