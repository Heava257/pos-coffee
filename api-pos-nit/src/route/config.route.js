const { validate_token } = require("../controller/auth.controller");
const { getList, getProductConfig } = require("../controller/config.controller");
module.exports = (app) => {
  app.get("/api/config", validate_token(), getList);
  app.get("/api/config/product/:product_id", validate_token(), getProductConfig);
};
