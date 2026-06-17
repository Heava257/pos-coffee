const { db } = require("../src/util/helper");
require("dotenv").config();

async function migrate() {
    console.log("🚀 Starting database schema self-healing...");
    
    // Define columns to ensure in 'businesses'
    const bizCols = [
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
        { name: "discount_applied_products", type: "TEXT DEFAULT NULL" }
    ];

    // Define columns to ensure in 'order_details'
    const orderDetailCols = [
        { name: "kitchen_batch_id", type: "VARCHAR(50) DEFAULT NULL" },
        { name: "kitchen_status", type: "VARCHAR(50) DEFAULT 'pending'" }
    ];

    try {
        // Migrate 'businesses'
        for (const col of bizCols) {
            const [check] = await db.query(
                `SELECT COUNT(*) AS count 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = ?`,
                [col.name]
            );
            if (check[0].count === 0) {
                console.log(`Adding column 'businesses.${col.name}'...`);
                await db.query(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column 'businesses.${col.name}' already exists.`);
            }
        }

        // Migrate 'order_details'
        for (const col of orderDetailCols) {
            const [check] = await db.query(
                `SELECT COUNT(*) AS count 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_details' AND COLUMN_NAME = ?`,
                [col.name]
            );
            if (check[0].count === 0) {
                console.log(`Adding column 'order_details.${col.name}'...`);
                await db.query(`ALTER TABLE order_details ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column 'order_details.${col.name}' already exists.`);
            }
        }

        console.log("✅ Database schema self-healing completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
