const { validate_token } = require("../controller/auth.controller");

const { getExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType } = require("../controller/expense_type.controller");
module.exports = (app) => {
  app.get("/api/expense_type", validate_token(), getExpenseTypes);
  // app.get("/api/expense", validate_token(), getList);
  app.post("/api/expanse_type", validate_token(), createExpenseType);
  app.put("/api/expanse_type/:id", validate_token(), updateExpenseType);
  app.delete("/api/expanse_type/:id", validate_token(), deleteExpenseType);
};
