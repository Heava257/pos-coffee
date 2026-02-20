const { db } = require('./src/util/helper');

async function setupPurchaseDb(connection) {
    try {
        if (!connection) connection = await db.getConnection();

        console.log("Starting Purchase & Stock Movement Setup...");

        // 1. Add raw_material_id to purchase_product
        try {
            await connection.query(`
        ALTER TABLE purchase_product 
        ADD COLUMN raw_material_id INT NULL AFTER product_id,
        ADD INDEX (raw_material_id);
      `);
            console.log("✅ Added raw_material_id to purchase_product table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ raw_material_id column already exists.");
            } else {
                console.error("Warning: purchase_product column add failed", e.message);
            }
        }

        // 2. Create stock_movement table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_movement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stock_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
        product_id INT NULL COMMENT 'If finished product moved',
        raw_material_id INT NULL COMMENT 'If raw material moved',
        qty DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255),
        ref_id INT NULL COMMENT 'Reference ID (Order ID or Purchase ID)',
        ref_type VARCHAR(50) NULL COMMENT 'order, purchase, adjustment',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        FOREIGN KEY (raw_material_id) REFERENCES raw_material(id) ON DELETE SET NULL,
        INDEX (stock_type),
        INDEX (ref_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log("✅ Created stock_movement table.");

        console.log("🎉 Purchase Setup Complete!");

    } catch (error) {
        console.error("❌ Setup Failed:", error);
    }
}

// Check if running directly
if (require.main === module) {
    (async () => {
        const connection = await db.getConnection();
        await setupPurchaseDb(connection);
        process.exit();
    })();
}

module.exports = setupPurchaseDb;
