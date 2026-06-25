
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const telegramPolling = require("./src/service/telegramPolling.service");
telegramPolling.start();

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

app.get("/api/ping", (req, res) => res.json({ status: "ok", time: new Date() }));
app.get("/api/redis-test", async (req, res) => {
  try {
    const { redis } = require("./src/util/redisClient");
    if (!redis) return res.json({ status: "error", message: "Redis Config Missing or Not Initialized" });
    await redis.set("test_key", "Hello from Redis!", "EX", 60);
    const value = await redis.get("test_key");
    res.json({ status: "ok", connected: true, value, message: "Redis is working perfectly!" });
  } catch (err) {
    res.json({ status: "error", connected: false, message: err.message });
  }
});

// Mount modularized API V1 routes
app.use("/api/v1", require("./routes"));
app.use("/api", require("./routes"));


app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }

  // Global Detailed Error Log
  console.error("🔥 Global Error Handler:", require("util").inspect(err, { depth: null, colors: true }));

  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error (Global)",
      message: err.message || "An unexpected error occurred."
    });
  }
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

  // Start modularized cron jobs
  try {
    require("./jobs/membershipExpire.job").start();
    require("./jobs/stockForecast.job").start();
    require("./jobs/salesSummary.job").start();
    require("./jobs/telegram.job").start();
    console.log("✨ All modular background jobs registered successfully.");
  } catch (jobErr) {
    console.error("Failed to start modular background jobs:", jobErr.message);
  }

  // Migration Fix: Ensure orders table allows NULL for user_id
  const { db } = require("./src/util/helper");
  try {
    await db.query("ALTER TABLE orders MODIFY user_id INT NULL");
    console.log("Migration: 'orders.user_id' is now NULLABLE");
    
    // 🚀 EMERGENCY FIX: Ensure Business 1 and its primary user are always active after a DB replacement
    await db.query("UPDATE businesses SET status = 'active' WHERE id = 1");
    await db.query("UPDATE users SET status = 'active', is_super_admin = 1 WHERE id = 1");
    await db.query("UPDATE users SET status = 'active' WHERE business_id = 1");
    console.log("Migration: Business 1 and its users are now ACTIVATED");

    // 🚀 EMERGENCY FIX 2: Ensure all existing users are marked as verified so they are not locked out
    try {
      await db.query("UPDATE users SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL");
      console.log("Migration: All existing users marked as verified");
    } catch (err) {
      console.error("Migration Error (is_verified):", err.message);
    }
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (orders.user_id) skipped:", err.message);
  }

  // ✅ Migration: Create business_categories junction table
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS business_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        category_id INT NOT NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_biz_cat (business_id, category_id)
      )
    `);
    console.log("Migration: 'business_categories' table is ready");
  } catch (err) {
    console.error("Migration Error (business_categories):", err.message);
  }

  // ✅ Migration: Create loyalty membership tables
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS membership_tiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        min_points INT DEFAULT 0,
        discount_rate DOUBLE DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Seed default tiers for business 1 if empty
    try {
      const [tiers] = await db.query("SELECT id FROM membership_tiers WHERE business_id = 1");
      if (tiers.length === 0) {
        await db.query(`
          INSERT INTO membership_tiers (business_id, name, min_points, discount_rate) VALUES 
          (1, 'Welcome', 0, 0),
          (1, 'Silver', 500, 5),
          (1, 'Gold', 1500, 10),
          (1, 'Platinum', 5000, 15)
        `);
        console.log("Migration: Seeded default membership tiers");
      }
    } catch (tierErr) {
      console.log("Migration (Seeding Tiers) skipped:", tierErr.message);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS waste (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        product_id INT NULL,
        raw_material_id INT NULL,
        qty DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: 'waste' table is ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_redeems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        business_id INT NOT NULL,
        reward_name VARCHAR(255) NOT NULL,
        stars_used INT DEFAULT 0,
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration: Loyalty tables are ready");
  } catch (err) {
    console.error("Migration Error (Loyalty Tables):", err.message);
  }

  // ✅ Migration: Add default config columns to categories table
  const catCols = ['default_moods', 'default_sizes', 'default_addons'];
  for (const col of catCols) {
    try {
      await db.query(`ALTER TABLE categories ADD COLUMN ${col} TEXT NULL`);
      console.log(`Migration: Added 'categories.${col}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) console.log(`Migration (categories.${col}) skipped:`, err.message);
    }
  }

  // Migration Fix: Ensure products table has 'brand' and 'discount' columns
  try {
    await db.query("ALTER TABLE products ADD COLUMN brand VARCHAR(255) AFTER barcode");
    console.log("Migration: Added 'brand' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.brand) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN discount DOUBLE DEFAULT 0;");
    console.log("Migration: Added 'discount' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.discount) skipped:", err.message);
  }

  // ✅ Migration: Add promotion fields to businesses table
  const promoCols = [
    { name: 'promo_title', type: 'VARCHAR(255) NULL' },
    { name: 'promo_subtitle', type: 'VARCHAR(255) NULL' },
    { name: 'promo_image', type: 'VARCHAR(500) NULL' },
    { name: 'promo_discount', type: 'VARCHAR(50) NULL' },
    { name: 'promo_is_active', type: 'TINYINT DEFAULT 0' }
  ];
  for (const col of promoCols) {
    try {
      await db.query(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'businesses.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate column")) console.log(`Migration (businesses.${col.name}) skipped:`, err.message);
    }
  }

  try {
    await db.query("ALTER TABLE businesses ADD COLUMN global_discount DOUBLE DEFAULT 0");
    console.log("Migration: Added 'global_discount' to businesses");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (businesses.global_discount) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN sizes TEXT NULL AFTER image");
    await db.query("ALTER TABLE products ADD COLUMN addons TEXT NULL AFTER sizes");
    console.log("Migration: Added 'sizes' and 'addons' columns to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.sizes/addons) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN description TEXT NULL AFTER name");
    console.log("Migration: Added 'description' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.description) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE branch_products ADD COLUMN min_stock_alert INT DEFAULT 5");
    console.log("Migration: Added 'min_stock_alert' column to branch_products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (branch_products.min_stock_alert) skipped:", err.message);
  }

  // ✅ Migration: Add Google OAuth columns to customers table
  try {
    await db.query("ALTER TABLE customers ADD COLUMN google_id VARCHAR(255) NULL AFTER email");
    await db.query("ALTER TABLE customers ADD COLUMN profile_image VARCHAR(500) NULL AFTER google_id");
    console.log("Migration: Added Google OAuth columns to 'customers' table");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (customers Google columns) skipped:", err.message);
  }

  // ✅ Migration: Add Loyalty and Membership columns to customers table
  const customerCols = [
    { name: "tier_id", type: "INT DEFAULT NULL" },
    { name: "points", type: "INT DEFAULT 0" },
    { name: "total_spent", type: "DOUBLE DEFAULT 0" },
    { name: "card_number", type: "VARCHAR(50) DEFAULT NULL" },
    { name: "wallet_balance", type: "DOUBLE DEFAULT 0" },
    { name: "otp_code", type: "VARCHAR(10) DEFAULT NULL" },
    { name: "otp_expiry", type: "DATETIME DEFAULT NULL" }
  ];
  for (const col of customerCols) {
    try {
      await db.query(`ALTER TABLE customers ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'customers.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) console.log(`Migration (customers.${col.name}) skipped:`, err.message);
    }
  }

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
    await db.query("ALTER TABLE orders MODIFY order_type VARCHAR(100) DEFAULT 'dine_in'");
    console.log("Migration: 'orders' table columns are now flexible VARCHARs");
  } catch (err) {
    console.error("Migration Error (orders table):", err.message);
  }

  // ✅ Migration: Add GPS verification and customer tracking to orders table
  try {
    await db.query("ALTER TABLE orders ADD COLUMN lat DOUBLE NULL");
    await db.query("ALTER TABLE orders ADD COLUMN lng DOUBLE NULL");
    await db.query("ALTER TABLE orders ADD COLUMN is_verified TINYINT DEFAULT 0");
    console.log("Migration: Added GPS columns to 'orders' table");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.error("Migration Error (orders GPS):", err.message);
  }

  try {
    await db.query("ALTER TABLE orders ADD COLUMN customer_id INT NULL AFTER business_id");
    console.log("Migration: Added 'customer_id' to 'orders' table");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.error("Migration Error (orders customer_id):", err.message);
  }

  // Migration Fix: Ensure branch_products has default values for price/cost to prevent crashes
  try {
    await db.query("ALTER TABLE branch_products MODIFY price DOUBLE DEFAULT 0");
    await db.query("ALTER TABLE branch_products MODIFY cost_price DOUBLE DEFAULT 0");
    console.log("Migration: 'branch_products' default values set");
  } catch (err) {
    console.error("Migration Error (branch_products):", err.message);
  }

  // Migration Fix: Ensure businesses table has all setting columns
  const bizCols = [
    { name: "address", type: "TEXT" },
    { name: "website", type: "VARCHAR(255)" },
    { name: "tax_percent", type: "DECIMAL(10, 2) DEFAULT 0" },
    { name: "service_charge", type: "DECIMAL(10, 2) DEFAULT 0" },
    { name: "kh_exchange_rate", type: "INT DEFAULT 4000" },
    { name: "currency_symbol", type: "VARCHAR(10) DEFAULT '$'" },
    { name: "telegram_link", type: "VARCHAR(255)" },
    { name: "facebook_link", type: "VARCHAR(255)" },
    { name: "telegram_token", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "telegram_chat_id", type: "VARCHAR(50) DEFAULT NULL" },
    { name: "plan_type", type: "VARCHAR(50) DEFAULT 'basic'" },
    { name: "active_modules", type: "TEXT" },
    { name: "telegram_mode", type: "VARCHAR(50) DEFAULT 'polling'" },
    { name: "telegram_webhook_url", type: "VARCHAR(500) DEFAULT NULL" },
    { name: "global_bogo_active", type: "TINYINT DEFAULT 0" },
    { name: "global_bogo_text", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "promo_scope", type: "VARCHAR(50) DEFAULT 'all'" },
    { name: "promo_applied_categories", type: "TEXT DEFAULT NULL" },
    { name: "promo_applied_products", type: "TEXT DEFAULT NULL" },
    { name: "promo_tag", type: "VARCHAR(50) DEFAULT NULL" },
    { name: "promo_tag_color", type: "VARCHAR(50) DEFAULT NULL" },
    { name: "promo_desc", type: "TEXT DEFAULT NULL" },
    { name: "promo_buy_qty", type: "INT DEFAULT 0" },
    { name: "promo_get_qty", type: "INT DEFAULT 0" },
    { name: "promo_start_date", type: "DATETIME DEFAULT NULL" },
    { name: "promo_end_date", type: "DATETIME DEFAULT NULL" },
    { name: "discount_scope", type: "VARCHAR(50) DEFAULT 'all'" },
    { name: "discount_applied_categories", type: "TEXT DEFAULT NULL" },
    { name: "discount_applied_products", type: "TEXT DEFAULT NULL" },
    { name: "smtp_user", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "smtp_pass", type: "VARCHAR(255) DEFAULT NULL" }
  ];

  for (const col of bizCols) {
    try {
      await db.query(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'businesses.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) {
        console.error(`Migration Error (businesses.${col.name}):`, err.message);
      }
    }
  }

  // Migration Fix: Ensure GPS fields exist in branches table
  const branchCols = [
    { name: "khqr_image", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "payment_merchant_id", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "payment_api_key", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "payment_receiver_name", type: "VARCHAR(255) DEFAULT NULL" },
    { name: "lat", type: "DECIMAL(10, 8) NULL" },
    { name: "lng", type: "DECIMAL(11, 8) NULL" }
  ];

  for (const col of branchCols) {
    try {
      await db.query(`ALTER TABLE branches ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'branches.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) {
        console.error(`Migration Error (branches.${col.name}):`, err.message);
      }
    }
  }

  // Migration Fix: Add GPS and verification fields to orders table
  const orderCols = [
    { name: "lat", type: "DECIMAL(10, 8) NULL" },
    { name: "lng", type: "DECIMAL(11, 8) NULL" },
    { name: "is_verified", type: "TINYINT(1) DEFAULT 0" },
    { name: "guest_count", type: "INT DEFAULT 1" },
    { name: "total_paid", type: "DECIMAL(10, 2) DEFAULT 0.00" }
  ];

  for (const col of orderCols) {
    try {
      await db.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'orders.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) {
        console.error(`Migration Error (orders.${col.name}):`, err.message);
      }
    }
  }

  // Migration Fix: Ensure KDS fields exist in order_details table
  const orderDetailCols = [
    { name: "kitchen_batch_id", type: "VARCHAR(50) DEFAULT NULL" },
    { name: "kitchen_status", type: "VARCHAR(50) DEFAULT 'pending'" }
  ];

  for (const col of orderDetailCols) {
    try {
      await db.query(`ALTER TABLE order_details ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added 'order_details.${col.name}'`);
    } catch (err) {
      if (!err.message.includes("Duplicate")) {
        console.error(`Migration Error (order_details.${col.name}):`, err.message);
      }
    }
  }

  // ✅ Migration: Force Grant 'Table Management' permission to all roles to fix 403
  try {
    const { db } = require("./src/util/helper");
    // Ensure 'Table Management' permission exists
    const [perms] = await db.query("SELECT id FROM permissions WHERE route_key = '/table' OR route_key = 'table'");
    let permId;
    if (perms.length === 0) {
      const [res] = await db.query("INSERT INTO permissions (name, route_key) VALUES ('Table Management', '/table')");
      permId = res.insertId;
    } else {
      permId = perms[0].id;
    }
    // Assign to all roles if missing
    const [roles] = await db.query("SELECT id FROM roles");
    for (const role of roles) {
      await db.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
        VALUES (?, ?, 1, 1, 1, 1)
      `, [role.id, permId]);
    }
    console.log("Migration: 'table' permissions granted to all roles");
  } catch (err) {
    console.error("Migration Error (Auto-Grant):", err.message);
  }

  // Migration Fix: Create system_settings table for platform-wide config
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sett_key VARCHAR(100) UNIQUE NOT NULL,
        sett_value TEXT DEFAULT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed default payment keys if missing
    const keys = ['payway_merchant_id', 'payway_api_key', 'payway_receiver_name', 'payway_khqr_image'];
    for (const key of keys) {
      await db.query("INSERT IGNORE INTO system_settings (sett_key) VALUES (?)", [key]);
    }

    console.log("Migration: 'system_settings' table ready");
  } catch (err) {
    console.error("Migration Error (system_settings):", err.message);
  }

  // Migration Fix: Create favorites table if missing
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration: 'favorites' table is ready");
  } catch (err) {
    console.error("Migration Error (favorites table):", err.message);
  }

  /* 
  // 🚀 SEEDER DEACTIVATED: Data already seeded. 
  // Running this on every boot causes instability and nodemon loops.
  try {
    const bizId = 5;
    const [branches] = await db.query("SELECT id FROM branches WHERE business_id = ? LIMIT 1", [bizId]);
    const branchId = branches[0]?.id || 6;

    // Get modern category mapping
    const [dbCats] = await db.query("SELECT id, name FROM categories WHERE business_id = ?", [bizId]);
    const catMap = {};
    dbCats.forEach(c => catMap[c.name] = c.id);

    const productsToSeed = [
      { cat: 'Juice', name: 'Fresh Orange Juice', price: 2.5, img: 'orange_juice.png' },
      { cat: 'Juice', name: 'Apple Juice Delight', price: 2.5, img: 'apple_juice.png' },
      { cat: 'Juice', name: 'Watermelon Splash', price: 2.5, img: 'watermelon_juice.png' },
      { cat: 'Juice', name: 'Pineapple Glow', price: 2.5, img: 'pineapple_juice.png' },
      { cat: 'Juice', name: 'Tropical Mixed Juice', price: 3.0, img: 'tropical_juice.png' },

      { cat: 'Milk', name: 'Pure Fresh Milk', price: 2.0, img: 'pure_milk.png' },
      { cat: 'Milk', name: 'Soy Milk Classic', price: 2.5, img: 'soy_milk.png' },
      { cat: 'Milk', name: 'Almond Milk Silky', price: 3.0, img: 'almond_milk.png' },
      { cat: 'Milk', name: 'Strawberry Milk Dream', price: 2.5, img: 'strawberry_milk.png' },
      { cat: 'Milk', name: 'Rich Chocolate Milk', price: 2.5, img: 'chocolate_milk.png' },

      { cat: 'Snack', name: 'Chocolate Cookies', price: 1.5, img: 'cookies.png' },
      { cat: 'Snack', name: 'Potato Chips', price: 1.5, img: 'potato_chips.png' },
      { cat: 'Snack', name: 'Butter Popcorn', price: 2.0, img: 'snack_cat.png' },
      { cat: 'Snack', name: 'Spicy Nachos', price: 3.5, img: 'snack_cat.png' },
      { cat: 'Snack', name: 'Fudge Brownie', price: 2.5, img: 'snack_cat.png' },

      { cat: 'Rice', name: 'Shrimp Fried Rice', price: 4.5, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Golden Steam Rice', price: 1.0, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Garlic Rice', price: 1.5, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Pineapple Rice', price: 5.0, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Holy Basil Rice', price: 4.0, img: 'rice_cat.png' },

      { cat: 'Dessert', name: 'New York Cheesecake', price: 3.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Tiramisu Cup', price: 4.0, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Mango Sticky Rice', price: 3.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Premium Ice Cream', price: 2.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Delicate Fruit Tart', price: 3.0, img: 'dessert_cat.png' }
    ];

    for (const p of productsToSeed) {
      const catId = catMap[p.cat];
      if (!catId) continue;

      const [exists] = await db.query("SELECT id FROM products WHERE name = ? AND business_id = ?", [p.name, bizId]);
      if (exists.length === 0) {
        const [res] = await db.query(
          "INSERT INTO products (business_id, category_id, name, image, status) VALUES (?, ?, ?, ?, 1)",
          [bizId, catId, p.name, p.img]
        );
        const pid = res.insertId;
        await db.query(
          "INSERT IGNORE INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, 100)",
          [branchId, pid, p.price, p.price * 0.5]
        );
        console.log(`Seeder: Added product '${p.name}'`);
      } else {
        await db.query("UPDATE products SET image = ? WHERE id = ?", [p.img, exists[0].id]);
        // console.log(`Seeder: Verified image for product '${p.name}'`);
      }
    }
  } catch (err) {
    console.error("Seeder Error:", err.message);
  }
  */
});

// Force restart for environment variables
