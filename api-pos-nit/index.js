
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const setupDatabase = require("./setup_inventory_db");
const setupPurchaseDb = require("./setup_purchase_db");
const updatePermissions = require("./update_permissions");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

require("./src/route/category.route")(app);
require("./src/route/auth.route")(app);
require("./src/route/role.route")(app);
require("./src/route/supplier.route")(app);
require("./src/route/config.route")(app);
require("./src/route/product.route_single_image")(app);
require("./src/route/customer.route")(app);
require("./src/route/expanse.route")(app);
require("./src/route/employee.route")(app);
// require("./src/route/order.route")(app);
require("./src/route/dashbaord.route")(app);
require("./src/route/report.route")(app);
require("./src/route/currency.route")(app);
require("./src/route/invoices.route")(app);
require("./src/route/purchase.route")(app);
require("./src/route/admin_stock_transfer.route")(app);
require("./src/route/StockUser.route")(app);
require("./src/route/Chat_Application.route")(app);
require("./src/route/order_menu.route")(app);
require("./src/route/exchange_rate.route")(app);
require("./src/route/shop.route")(app);
require("./src/route/raw_material.route")(app);
require("./src/route/recipe.route")(app);

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }
  next(err);
});


const http = require('http');
const server = http.createServer({
  maxHeaderSize: 65536, // 64KB
  headersTimeout: 120000, // 2 minutes
  keepAliveTimeout: 120000, // 2 minutes
}, app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log("Server running on port " + PORT);
  await setupDatabase();
  await setupPurchaseDb();
  await updatePermissions();
});
