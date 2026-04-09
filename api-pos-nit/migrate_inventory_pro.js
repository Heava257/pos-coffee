require('dotenv').config();
const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Starting Migration: Inventory Pro...");

        const addColumn = async (table, col, definition) => {
            try {
                await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
                console.log(`+ Added ${col} to ${table}`);
            } catch (err) {
                if (err.message.includes("Duplicate column name")) {
                    console.log(`  (Skipped) ${col} already exists in ${table}`);
                } else {
                    throw err;
                }
            }
        };

        // 1. Update purchase_product table
        console.log("Updating purchase_product table...");
        await addColumn('purchase_product', 'received_qty', 'DECIMAL(10, 2) DEFAULT 0');
        await addColumn('purchase_product', 'expiry_date', 'DATE DEFAULT NULL');
        await addColumn('purchase_product', 'batch_no', 'VARCHAR(50) DEFAULT NULL');

        // 2. Add business_type to businesses
        console.log("Updating businesses table...");
        await addColumn('businesses', 'business_type', "ENUM('retail', 'coffee', 'pharmacy', 'restaurant') DEFAULT 'retail'");

        // 3. Create stock_transfers table
        console.log("Creating stock_transfers table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transfers (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                business_id     INT NOT NULL,
                from_branch_id  INT NOT NULL,
                to_branch_id    INT NOT NULL,
                ref             VARCHAR(50) NOT NULL,
                status          ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
                note            TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by      INT,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
                FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // 4. Create stock_transfer_items table
        console.log("Creating stock_transfer_items table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transfer_items (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                transfer_id     INT NOT NULL,
                product_id      INT NULL,
                raw_material_id INT NULL,
                qty             DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                FOREIGN KEY (raw_material_id) REFERENCES raw_material(id) ON DELETE SET NULL
            )
        `);

        console.log("Migration Successful: Inventory Pro completed.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
