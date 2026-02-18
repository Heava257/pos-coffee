const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getBalanceData,
  getTransactions,

} = require("../controller/exchange_rate.controller");
module.exports = (app) => {
  app.get("/api/exchange_rate", validate_token(), getList);
  app.get("/api/balance_data", validate_token(), getBalanceData);
  app.get("/api/transactions", validate_token(), getTransactions);

};
