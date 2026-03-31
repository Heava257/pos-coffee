const authMiddleware = require("../middleware/auth.middleware");
const { uploadFile } = require("../util/helper");
const {
  getList,
  create,
  update,
  remove
} = require("../controller/category.controller");

module.exports = (app) => {
  app.get("/api/category", authMiddleware(), getList);
  app.post("/api/category", authMiddleware("category"), uploadFile.single("image"), create);
  app.put("/api/category", authMiddleware("category"), uploadFile.single("image"), update);
  app.delete("/api/category", authMiddleware("category"), remove);
};