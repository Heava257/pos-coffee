const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  create,
  update,
  remove,
  topup,
  getDetail,
  getInactive,
  getMarketingStats
} = require("../controller/customer.controller");

module.exports = (app) => {
  app.get("/api/customer", authMiddleware(), getList);
  app.get("/api/customer/inactive", authMiddleware(), getInactive);
  app.get("/api/customer/marketing-stats", authMiddleware(), getMarketingStats);
  app.get("/api/customer/detail/:id", getDetail); // Public for portal
  app.post("/api/customer/public-create", require("../controller/customer.controller").publicCreate);
  app.post("/api/customer/send-otp", require("../controller/customer.controller").sendOTP);
  app.post("/api/customer/verify-otp", require("../controller/customer.controller").verifyOTP);
  app.post("/api/customer/google-login", require("../controller/customer.controller").googleLogin);
  app.post("/api/customer", authMiddleware(), create);
  app.post("/api/customer/topup", authMiddleware(), topup);
  app.post("/api/customer/send-promo", authMiddleware(), require("../controller/customer.controller").sendPromoEmail);
  app.post("/api/customer/redeem", require("../controller/customer.controller").redeemReward);
  app.put("/api/customer/public-update", require("../controller/customer.controller").publicUpdate);
  app.put("/api/customer", authMiddleware(), update);
  app.delete("/api/customer", authMiddleware(), remove);
};
