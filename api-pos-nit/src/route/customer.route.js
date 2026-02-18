const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  assignCustomerToUser,
} = require("../controller/customer.controller");
module.exports = (app) => {
 // In your backend file (e.g., server.js or routes.js)
  app.get("/api/customer/:user_id",validate_token("customer.getlist"),getList);
  app.post("/api/customer", validate_token("customer.create"), create);
  app.post("/api/customer/user", validate_token("customer.create"), assignCustomerToUser);
  app.put("/api/customer/:id", validate_token("customer.update"), update);
  app.delete("/api/customer/:id", validate_token("customer.remove"), remove);
};

