const { db } = require('./src/util/helper');

async function setupPurchaseDb(connection) {
    let localConnection = false;
    try {
        if (!connection) {
            connection = await db.getConnection();
            localConnection = true;
        }

        console.log("Starting Purchase & Stock Movement Setup...");

        // 0. Ensure PURCHASE table exists
        await connection.query(`
      CREATE TABLE IF NOT EXISTS purchase (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT NULL,
        ref VARCHAR(50) NOT NULL,
        company_id INT NOT NULL,
        total_amount DECIMAL(10, 2) DEFAULT 0.00,
        paid_amount DECIMAL(10, 2) DEFAULT 0.00,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        INDEX (company_id),
        INDEX (supplier_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log("✅ Checked purchase table.");

        // 1. Add raw_material_id to purchase_product
        // If purchase_product doesn't exist, create it first (failsafe)
        await connection.query(`
       CREATE TABLE IF NOT EXISTS purchase_product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT NOT NULL,
        product_id INT NULL,
        qty DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE CASCADE,
        INDEX (purchase_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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
    } finally {
        if (localConnection && connection) connection.release();
    }
}

// Check if running directly
if (require.main === module) {
    (async () => {
        const connection = await db.getConnection();
        await setupPurchaseDb(connection);
        connection.release(); // Release properly
        process.exit();
    })();
}

module.exports = setupPurchaseDb;
