
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cors({ origin: "*" }));
app.use('/public', express.static('public', {
  setHeaders: (res, path) => {
    if (path.includes('images') && !path.includes('.')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));

require("./src/route/auth.route")(app);
require("./src/route/user.route")(app);
require("./src/route/branch.route")(app);
require("./src/route/role.route")(app);
require("./src/route/category.route")(app);
require("./src/route/product.route")(app);
require("./src/route/expense.route")(app);
require("./src/route/order.route")(app);
require("./src/route/dashbaord.route")(app);
require("./src/route/report.route")(app);
require("./src/route/supplier.route")(app);
require("./src/route/purchase.route")(app);
require("./src/route/raw_material.route")(app);
require("./src/route/config.route")(app);
require("./src/route/customer.route")(app);
require("./src/route/employee.route")(app);
require("./src/route/recipe.route")(app);
require("./src/route/permission.route")(app);
require("./src/route/plan.route")(app);
require("./src/route/business.route")(app);
require("./src/route/exchange.route")(app);
require("./src/route/payment.route")(app);
require("./src/route/stock.route")(app);
require("./src/route/table.route")(app);

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

  // STEP 3: Start subscription auto-expiry cron job
  const { startSubscriptionCron } = require("./src/util/cron");
  startSubscriptionCron();

  // Migration Fix: Ensure orders table allows NULL for user_id
  const { db } = require("./src/util/helper");
  try {
    await db.query("ALTER TABLE orders MODIFY user_id INT NULL");
    console.log("Migration: 'orders.user_id' is now NULLABLE");
  } catch (err) { }

  // Migration Fix: Ensure products table has 'brand' and 'discount' columns
  try {
    await db.query("ALTER TABLE products ADD COLUMN brand VARCHAR(255) AFTER barcode");
    console.log("Migration: Added 'brand' column to products");
  } catch (err) { }

  try {
    await db.query("ALTER TABLE products ADD COLUMN discount DOUBLE DEFAULT 0;");
    console.log("Migration: Added 'discount' column to products");
  } catch (err) { }

  // Migration Fix: Add missing categories once
  try {
    const bizId = 5;
    const cats = ['Juice', 'Milk', 'Snack', 'Rice', 'Dessert'];
    for (const name of cats) {
      const [rows] = await db.query("SELECT id FROM categories WHERE name = ? AND business_id = ?", [name, bizId]);
      if (rows.length === 0) {
        await db.query("INSERT INTO categories (business_id, name) VALUES (?, ?)", [bizId, name]);
        console.log(`Migration: Added missing category '${name}'`);
      }
    }
  } catch (err) { }

  // Migration Fix: Broaden orders table columns to prevent truncation
  try {
    await db.query("ALTER TABLE orders MODIFY payment_method VARCHAR(100) DEFAULT 'cash'");
    await db.query("ALTER TABLE orders MODIFY status VARCHAR(100) DEFAULT 'ordered'");
    console.log("Migration: 'orders.payment_method' and 'orders.status' are now flexible VARCHARs");
  } catch (err) {
    console.error("Migration Error (orders table):", err.message);
  }
});

