const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getone,
  create,
  create_byCashie,
} = require("../controller/order_menu.controller");
module.exports = (app) => {
  app.get("/api/orders/user/:id", validate_token("order.getlist"), getList);
  app.get("/api/orders/:id", validate_token("order.getone"), getone);
  app.post("/api/orders", validate_token(), create);
  app.post("/api/orders/create_byCashie", validate_token(), create_byCashie);

};