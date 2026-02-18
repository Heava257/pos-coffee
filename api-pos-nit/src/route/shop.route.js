const { validate_token } = require("../controller/auth.controller");
const { getShops, createShop, updateShop, deleteShop, getShopProducts, handleQRScan, getShop } = require("../controller/shop.controller");

module.exports = (app) => {

  app.get("/api/shops", validate_token(), getShops);
  app.get("/api/shops/:id", validate_token(), getShop);
  app.post("/api/shops", validate_token(), createShop);
  app.put("/api/shops/:id", validate_token(), updateShop);
  app.delete("/api/shops/:id", validate_token(), deleteShop);
  app.get("/api/product/shop/:shop_id", validate_token(), getShopProducts);
  app.get("/api/scan", handleQRScan); 
  app.get("/api/scan/auth", validate_token(), handleQRScan);
};