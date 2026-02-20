const { db } = require('./src/util/helper');

async function setupDatabase(connection) {
    let localConnection = false;
    try {
        if (!connection) {
            connection = await db.getConnection();
            localConnection = true;
        }

        console.log("Starting Database Setup for Inventory System...");

        // 1. Add product_type to product table if not exists
        try {
            await connection.query(`
        ALTER TABLE product 
        ADD COLUMN product_type ENUM('recipe', 'ready') DEFAULT 'ready' AFTER name;
      `);
            console.log("✅ Added product_type to product table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ product_type column already exists.");
            } else {
                console.error("Warning: Failed to add product_type", e.message);
            }
        }

        // 2. Create raw_material table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS raw_material (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        unit VARCHAR(20) NOT NULL COMMENT 'e.g. g, ml, pcs',
        price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Cost per unit',
        qty DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Current stock quantity',
        min_stock DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Alert level',
        image VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        create_by VARCHAR(100),
        INDEX (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log("✅ Checked raw_material table.");

        // 3. Create recipe_detail table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS recipe_detail (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        raw_material_id INT NOT NULL,
        qty DECIMAL(10, 2) NOT NULL COMMENT 'Amount of raw material needed',
        unit VARCHAR(20) COMMENT 'Unit used in recipe',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
        FOREIGN KEY (raw_material_id) REFERENCES raw_material(id) ON DELETE CASCADE,
        INDEX (product_id),
        INDEX (raw_material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log("✅ Checked recipe_detail table.");

        console.log("🎉 Inventory Database Setup Complete!");

    } catch (error) {
        console.error("❌ Inventory Database Setup Failed:", error);
    } finally {
        if (localConnection && connection) connection.release();
    }
}

// Check if running directly
if (require.main === module) {
    (async () => {
        const connection = await db.getConnection();
        await setupDatabase(connection);
        connection.release(); // Release properly
        process.exit();
    })();
}

module.exports = setupDatabase;
