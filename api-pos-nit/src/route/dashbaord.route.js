const { validate_token } = require("../controller/auth.controller");
const {
  getList,
} = require("../controller/dashbaord.controller");
module.exports = (app) => {
  app.get("/api/dashbaord", validate_token("dashboard.getlist"), getList);
  
};
