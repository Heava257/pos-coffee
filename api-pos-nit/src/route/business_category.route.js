const authMiddleware = require("../middleware/auth.middleware");
const { getList, toggle, bulkSave } = require("../controller/business_category.controller");

module.exports = (app) => {
  // Get all platform categories with activation status for current business
  app.get("/api/business-categories", authMiddleware("category"), getList);
  // Toggle a single category on/off
  app.put("/api/business-categories/toggle", authMiddleware("category"), toggle);
  // Save all category selections at once
  app.post("/api/business-categories/bulk", authMiddleware("category"), bulkSave);
};
