const { db } = require('./src/util/helper');

async function setupPurchaseDb(connection) {
    let localConnection = false;
    try {
        if (!connection) {
            connection = await db.getConnection();
            localConnection = true;
        }

        console.log("Starting Purchase & Stock Movement Setup...");

        // 0. Ensure PURCHASE table exists with ALL columns
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

        // --- Helper to add column if missing ---
        const addColumn = async (table, column, definition) => {
            try {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                console.log(`✅ Added ${column} to ${table} table.`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ ${column} column already exists in ${table}.`);
                } else {
                    console.error(`Warning: Failed to add ${column} to ${table}`, e.message);
                }
            }
        };

        // 0.1 Explicitly check/add ALL potentially missing columns in 'purchase'
        await addColumn('purchase', 'company_id', 'INT NOT NULL AFTER ref, ADD INDEX (company_id)');
        await addColumn('purchase', 'total_amount', 'DECIMAL(10, 2) DEFAULT 0.00 AFTER company_id');
        await addColumn('purchase', 'paid_amount', 'DECIMAL(10, 2) DEFAULT 0.00 AFTER total_amount');
        await addColumn('purchase', 'note', 'TEXT AFTER paid_amount');
        await addColumn('purchase', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER note');
        await addColumn('purchase', 'created_by', 'VARCHAR(100) AFTER created_at');
        await addColumn('purchase', 'supplier_id', 'INT NULL AFTER id, ADD INDEX (supplier_id)');
        await addColumn('purchase', 'ref', 'VARCHAR(50) NOT NULL AFTER supplier_id');


        // 1. Ensure PURCHASE_PRODUCT table exists
        await connection.query(`
       CREATE TABLE IF NOT EXISTS purchase_product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT NOT NULL,
        product_id INT NULL,
        raw_material_id INT NULL,
        qty DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE CASCADE,
        INDEX (purchase_id),
        INDEX (raw_material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

        // 1.1 Check columns for purchase_product
        await addColumn('purchase_product', 'raw_material_id', 'INT NULL AFTER product_id, ADD INDEX (raw_material_id)');
        await addColumn('purchase_product', 'qty', 'DECIMAL(10, 2) NOT NULL');
        await addColumn('purchase_product', 'cost', 'DECIMAL(10, 2) NOT NULL');
        await addColumn('purchase_product', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        await addColumn('purchase_product', 'created_by', 'VARCHAR(100)');


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
