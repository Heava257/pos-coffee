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

        // 0.1 explicitly add company_id if missing (handling existing tables)
        try {
            await connection.query(`
        ALTER TABLE purchase 
        ADD COLUMN company_id INT NOT NULL AFTER ref,
        ADD INDEX (company_id);
      `);
            console.log("✅ Added company_id to purchase table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ company_id column already exists in purchase.");
            } else {
                console.error("Warning: purchase column add failed (company_id)", e.message);
            }
        }

        // 0.2 Check for total_amount and paid_amount column names (handle legacy `total` vs `total_amount`)
        try {
            await connection.query(`
         ALTER TABLE purchase 
         ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER company_id;
       `);
            console.log("✅ Added total_amount to purchase table.");
        } catch (e) {
            // If duplicate, it's fine. If standard error, check if 'total' exists and rename?
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ total_amount column already exists.");
            } else {
                console.log("Warning: Failed to add total_amount", e.message);
            }
        }

        try {
            await connection.query(`
          ALTER TABLE purchase 
          ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER total_amount;
        `);
            console.log("✅ Added paid_amount to purchase table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ paid_amount column already exists.");
            } else {
                console.log("Warning: Failed to add paid_amount", e.message);
            }
        }


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
        console.log("✅ Checked stock_movement table.");

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
