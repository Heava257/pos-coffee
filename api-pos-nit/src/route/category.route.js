const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  getParentCategories,
  seedDefaultCategories,
} = require("../controller/category.controller");

module.exports = (app) => {
  // Main category routes
  app.get("/api/category", validate_token("category.getlist"), getList); 
  app.post("/api/category", validate_token("category.create"), create);
  app.put("/api/category", validate_token("category.update"), update);
  app.delete("/api/category", validate_token("category.remove"), remove);
  app.get("/api/category/getParentCategories", validate_token("category.getlist"), getParentCategories);
  app.get("/api/category/getParentCategoriesWithDefaults", validate_token(), seedDefaultCategories);
};