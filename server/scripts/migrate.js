/**
 * scripts/migrate.js — C-3 FIX
 *
 * All schema migrations live here, NOT inside index.js app.listen().
 * Each migration is idempotent (safe to run multiple times).
 *
 * Run manually:  node scripts/migrate.js
 * Run on startup via index.js → runMigrations()
 *
 * IMPORTANT: One-time emergency admin fixes (setting is_super_admin, etc.)
 * should be done directly in the DB console, NOT in this file.
 */

'use strict';

require('dotenv').config();
const db = require('../src/util/connection');

/**
 * Helper: run an ALTER TABLE and swallow "Duplicate column" errors (idempotent).
 */
async function safeAlter(sql, label) {
  try {
    await db.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (err.message.includes('Duplicate column') || err.message.includes('Duplicate key')) {
      // Column / key already exists — that's fine
    } else {
      console.warn(`  ⚠ ${label} skipped:`, err.message);
    }
  }
}

/**
 * Helper: INSERT IGNORE a single system_settings row.
 */
async function ensureSetting(key, val) {
  await db.query(
    'INSERT INTO system_settings (sett_key, sett_value) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE sett_key = ?)',
    [key, val, key]
  );
}

async function runMigrations() {
  console.log('🔄 Running migrations...');

  // ── Orders table ───────────────────────────────────────────────────────────
  await safeAlter('ALTER TABLE orders MODIFY user_id INT NULL', 'orders.user_id NULLABLE');
  await safeAlter("ALTER TABLE orders MODIFY payment_method VARCHAR(100) DEFAULT 'cash'", 'orders.payment_method VARCHAR');
  await safeAlter("ALTER TABLE orders MODIFY status VARCHAR(100) DEFAULT 'ordered'", 'orders.status VARCHAR');
  await safeAlter("ALTER TABLE orders MODIFY order_type VARCHAR(100) DEFAULT 'dine_in'", 'orders.order_type VARCHAR');
  await safeAlter('ALTER TABLE orders ADD COLUMN customer_id INT NULL AFTER business_id', 'orders.customer_id');
  await safeAlter('ALTER TABLE orders ADD COLUMN lat DECIMAL(10, 8) NULL', 'orders.lat');
  await safeAlter('ALTER TABLE orders ADD COLUMN lng DECIMAL(11, 8) NULL', 'orders.lng');
  await safeAlter('ALTER TABLE orders ADD COLUMN is_verified TINYINT(1) DEFAULT 0', 'orders.is_verified');
  await safeAlter('ALTER TABLE orders ADD COLUMN guest_count INT DEFAULT 1', 'orders.guest_count');
  await safeAlter('ALTER TABLE orders ADD COLUMN total_paid DECIMAL(10, 2) DEFAULT 0.00', 'orders.total_paid');

  // ── Order Details ──────────────────────────────────────────────────────────
  await safeAlter("ALTER TABLE order_details ADD COLUMN kitchen_batch_id VARCHAR(50) DEFAULT NULL", 'order_details.kitchen_batch_id');
  await safeAlter("ALTER TABLE order_details ADD COLUMN kitchen_status VARCHAR(50) DEFAULT 'pending'", 'order_details.kitchen_status');

  // ── Products ───────────────────────────────────────────────────────────────
  await safeAlter('ALTER TABLE products ADD COLUMN brand VARCHAR(255) AFTER barcode', 'products.brand');
  await safeAlter('ALTER TABLE products ADD COLUMN discount DOUBLE DEFAULT 0', 'products.discount');
  await safeAlter('ALTER TABLE products ADD COLUMN sizes TEXT NULL AFTER image', 'products.sizes');
  await safeAlter('ALTER TABLE products ADD COLUMN addons TEXT NULL AFTER sizes', 'products.addons');
  await safeAlter('ALTER TABLE products ADD COLUMN description TEXT NULL AFTER name', 'products.description');

  // ── Branch Products ────────────────────────────────────────────────────────
  await safeAlter('ALTER TABLE branch_products ADD COLUMN min_stock_alert INT DEFAULT 5', 'branch_products.min_stock_alert');
  await safeAlter('ALTER TABLE branch_products MODIFY price DOUBLE DEFAULT 0', 'branch_products.price');
  await safeAlter('ALTER TABLE branch_products MODIFY cost_price DOUBLE DEFAULT 0', 'branch_products.cost_price');

  // ── Branches ───────────────────────────────────────────────────────────────
  await safeAlter('ALTER TABLE branches ADD COLUMN khqr_image VARCHAR(255) DEFAULT NULL', 'branches.khqr_image');
  await safeAlter('ALTER TABLE branches ADD COLUMN payment_merchant_id VARCHAR(255) DEFAULT NULL', 'branches.payment_merchant_id');
  await safeAlter('ALTER TABLE branches ADD COLUMN payment_api_key VARCHAR(255) DEFAULT NULL', 'branches.payment_api_key');
  await safeAlter('ALTER TABLE branches ADD COLUMN payment_receiver_name VARCHAR(255) DEFAULT NULL', 'branches.payment_receiver_name');
  await safeAlter('ALTER TABLE branches ADD COLUMN lat DECIMAL(10, 8) NULL', 'branches.lat');
  await safeAlter('ALTER TABLE branches ADD COLUMN lng DECIMAL(11, 8) NULL', 'branches.lng');

  // ── Customers ──────────────────────────────────────────────────────────────
  await safeAlter('ALTER TABLE customers ADD COLUMN google_id VARCHAR(255) NULL AFTER email', 'customers.google_id');
  await safeAlter('ALTER TABLE customers ADD COLUMN profile_image VARCHAR(500) NULL AFTER google_id', 'customers.profile_image');
  await safeAlter('ALTER TABLE customers ADD COLUMN tier_id INT DEFAULT NULL', 'customers.tier_id');
  await safeAlter('ALTER TABLE customers ADD COLUMN points INT DEFAULT 0', 'customers.points');
  await safeAlter('ALTER TABLE customers ADD COLUMN total_spent DOUBLE DEFAULT 0', 'customers.total_spent');
  await safeAlter('ALTER TABLE customers ADD COLUMN card_number VARCHAR(50) DEFAULT NULL', 'customers.card_number');
  await safeAlter('ALTER TABLE customers ADD COLUMN wallet_balance DOUBLE DEFAULT 0', 'customers.wallet_balance');
  await safeAlter('ALTER TABLE customers ADD COLUMN otp_code VARCHAR(10) DEFAULT NULL', 'customers.otp_code');
  await safeAlter('ALTER TABLE customers ADD COLUMN otp_expiry DATETIME DEFAULT NULL', 'customers.otp_expiry');

  // ── Businesses ─────────────────────────────────────────────────────────────
  const bizColumns = [
    { name: 'address', type: 'TEXT' },
    { name: 'website', type: 'VARCHAR(255)' },
    { name: 'tax_percent', type: 'DECIMAL(10, 2) DEFAULT 0' },
    { name: 'service_charge', type: 'DECIMAL(10, 2) DEFAULT 0' },
    { name: 'kh_exchange_rate', type: 'INT DEFAULT 4000' },
    { name: "currency_symbol", type: "VARCHAR(10) DEFAULT '$'" },
    { name: 'telegram_link', type: 'VARCHAR(255)' },
    { name: 'facebook_link', type: 'VARCHAR(255)' },
    { name: 'telegram_token', type: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'telegram_chat_id', type: 'VARCHAR(50) DEFAULT NULL' },
    { name: "plan_type", type: "VARCHAR(50) DEFAULT 'basic'" },
    { name: 'active_modules', type: 'TEXT' },
    { name: "telegram_mode", type: "VARCHAR(50) DEFAULT 'polling'" },
    { name: 'telegram_webhook_url', type: 'VARCHAR(500) DEFAULT NULL' },
    { name: 'global_bogo_active', type: 'TINYINT DEFAULT 0' },
    { name: 'global_bogo_text', type: 'VARCHAR(255) DEFAULT NULL' },
    { name: "promo_scope", type: "VARCHAR(50) DEFAULT 'all'" },
    { name: 'promo_applied_categories', type: 'TEXT DEFAULT NULL' },
    { name: 'promo_applied_products', type: 'TEXT DEFAULT NULL' },
    { name: 'promo_tag', type: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'promo_tag_color', type: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'promo_desc', type: 'TEXT DEFAULT NULL' },
    { name: 'promo_buy_qty', type: 'INT DEFAULT 0' },
    { name: 'promo_get_qty', type: 'INT DEFAULT 0' },
    { name: 'promo_start_date', type: 'DATETIME DEFAULT NULL' },
    { name: 'promo_end_date', type: 'DATETIME DEFAULT NULL' },
    { name: "discount_scope", type: "VARCHAR(50) DEFAULT 'all'" },
    { name: 'discount_applied_categories', type: 'TEXT DEFAULT NULL' },
    { name: 'discount_applied_products', type: 'TEXT DEFAULT NULL' },
    { name: 'smtp_user', type: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'smtp_pass', type: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'global_discount', type: 'DOUBLE DEFAULT 0' },
    { name: 'promo_title', type: 'VARCHAR(255) NULL' },
    { name: 'promo_subtitle', type: 'VARCHAR(255) NULL' },
    { name: 'promo_image', type: 'VARCHAR(500) NULL' },
    { name: 'promo_discount', type: 'VARCHAR(50) NULL' },
    { name: 'promo_is_active', type: 'TINYINT DEFAULT 0' },
  ];
  for (const col of bizColumns) {
    await safeAlter(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`, `businesses.${col.name}`);
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  for (const col of ['default_moods', 'default_sizes', 'default_addons']) {
    await safeAlter(`ALTER TABLE categories ADD COLUMN ${col} TEXT NULL`, `categories.${col}`);
  }

  // ── Tables created if missing ──────────────────────────────────────────────
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sett_key VARCHAR(100) UNIQUE NOT NULL,
      sett_value TEXT DEFAULT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS security_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(45) NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      endpoint VARCHAR(255) NULL,
      user_agent VARCHAR(500) NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(45) NOT NULL UNIQUE,
      reason VARCHAR(255) NULL,
      blocked_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 1. Developer Portal API Keys Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS developer_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      client_id VARCHAR(100) UNIQUE NOT NULL,
      client_secret VARCHAR(255) NOT NULL,
      scopes TEXT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 2. Webhook Endpoints Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url VARCHAR(500) NOT NULL,
      events TEXT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 3. Payment Gateways Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      merchant_id VARCHAR(255) DEFAULT NULL,
      api_key VARCHAR(255) DEFAULT NULL,
      secure_hash VARCHAR(255) DEFAULT NULL,
      currency VARCHAR(50) DEFAULT 'USD/KHR',
      status VARCHAR(50) DEFAULT 'inactive',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Pre-seed payment gateways
  await db.query(`
    INSERT IGNORE INTO payment_gateways (id, name, merchant_id, api_key, secure_hash, currency, status) VALUES
    (1, 'ABA PayWay', 'm_aba_coffee', 'api_aba_live_******************', 'hash_aba_live_******************', 'USD/KHR', 'active'),
    (2, 'Stripe', 'acct_stripe_1120', 'sk_live_51M******************', 'hash_stripe_live_******************', 'USD', 'active'),
    (3, 'Wing Pay', 'm_wing_489', 'key_wing_live_******************', 'hash_wing_live_******************', 'USD/KHR', 'inactive'),
    (4, 'Acleda X-Pay', 'ac_xpay_902', 'sk_acleda_live_******************', 'hash_acleda_live_******************', 'KHR', 'inactive')
  `);

  // ── System Settings seed ───────────────────────────────────────────────────
  const defaultSettings = [
    ['payway_merchant_id', ''],
    ['payway_api_key', ''],
    ['payway_receiver_name', ''],
    ['payway_khqr_image', ''],
    ['telegram_support_link', 'https://t.me/growme_support'],
    ['payment_imap_host', 'imap.gmail.com'],
    ['payment_imap_port', '993'],
    ['payment_imap_user', ''],
    ['payment_imap_pass', ''],
    ['audit_logs_cleanup_enabled', 'true'],
    ['audit_logs_retention_days', '90'],
  ];
  for (const [key, val] of defaultSettings) {
    await ensureSetting(key, val);
  }

  // ── Permission: Table Management (ensure all roles have it) ───────────────
  try {
    const [perms] = await db.query("SELECT id FROM permissions WHERE route_key = '/table' OR route_key = 'table'");
    let permId;
    if (perms.length === 0) {
      const [res] = await db.query("INSERT INTO permissions (name, route_key) VALUES ('Table Management', '/table')");
      permId = res.insertId;
    } else {
      permId = perms[0].id;
    }
    const [roles] = await db.query('SELECT id FROM roles');
    for (const role of roles) {
      await db.query(
        'INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)',
        [role.id, permId]
      );
    }
  } catch (err) {
    console.warn('  ⚠ Permission seed skipped:', err.message);
  }

  // ── Seed Default Templates for Business ID: 1 ──────────────────────────────
  try {
    // 1. Ensure Manager exists for Business 1
    const [mgrRole] = await db.query("SELECT id FROM roles WHERE business_id = 1 AND code = 'manager'");
    let mgrRoleId;
    if (mgrRole.length === 0) {
      const [res] = await db.query("INSERT INTO roles (business_id, name, code) VALUES (1, 'Manager', 'manager')");
      mgrRoleId = res.insertId;
    } else {
      mgrRoleId = mgrRole[0].id;
    }

    // 2. Ensure Sale exists for Business 1
    const [saleRole] = await db.query("SELECT id FROM roles WHERE business_id = 1 AND code = 'sale'");
    let saleRoleId;
    if (saleRole.length === 0) {
      const [res] = await db.query("INSERT INTO roles (business_id, name, code) VALUES (1, 'Sale', 'sale')");
      saleRoleId = res.insertId;
    } else {
      saleRoleId = saleRole[0].id;
    }

    // Seed default permissions for them if newly created
    if (mgrRoleId) {
      await db.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
        SELECT ?, id, 1, 1, 1, 1 FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/stock', '/supplier', '/purchase', '/report_Sale_Summary', '/profile', '/table', '/expense')
      `, [mgrRoleId]);
    }
    if (saleRoleId) {
      await db.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
        SELECT ?, id, 1, 1, 1, 1 FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/table', '/profile')
      `, [saleRoleId]);
    }
    console.log("  ✓ Seeded Default Templates for Business ID 1");
  } catch (err) {
    console.warn("  ⚠ Seeding templates failed:", err.message);
  }

  // ── Security Tables ────────────────────────────────────────────────────────
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        endpoint VARCHAR(255) NULL,
        user_agent VARCHAR(500) NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ security_logs table verified');
  } catch (err) {
    console.warn('  ⚠ security_logs table creation skipped:', err.message);
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL UNIQUE,
        reason VARCHAR(255) NULL,
        blocked_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ blocked_ips table verified');
  } catch (err) {
    console.warn('  ⚠ blocked_ips table creation skipped:', err.message);
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_uuid VARCHAR(100) NOT NULL UNIQUE,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ user_sessions table verified');
  } catch (err) {
    console.warn('  ⚠ user_sessions table creation skipped:', err.message);
  }

  // ── Mark all users as verified (one-time unlock for existing accounts) ─────
  try {
    await db.query('UPDATE users SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL');
  } catch (err) { /* column may not exist yet */ }

  console.log('✅ All migrations complete.');
}

// Allow running directly: node scripts/migrate.js
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { runMigrations };
