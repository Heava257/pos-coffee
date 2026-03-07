const authMiddleware = require("../middleware/auth.middleware");
const { getList } = require("../controller/dashbaord.controller");

module.exports = (app) => {
  app.get("/api/dashbaord", authMiddleware(), getList);
};
