const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Starting Migration: Modular Package Engine...");

        // 1. Create modular_packages table
        await db.query(`
            CREATE TABLE IF NOT EXISTS modular_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                icon VARCHAR(100),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_VALUE
            ) ENGINE=InnoDB;
        `.replace('CURRENT_VALUE', 'CURRENT_TIMESTAMP'));
        console.log("- Created modular_packages table.");

        // 2. Create package_permissions junction table
        await db.query(`
            CREATE TABLE IF NOT EXISTS package_permissions (
                package_id INT NOT NULL,
                permission_id INT NOT NULL,
                PRIMARY KEY (package_id, permission_id),
                FOREIGN KEY (package_id) REFERENCES modular_packages(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("- Created package_permissions table.");

        // 3. Insert Default Industry Blueprints
        const [res] = await db.query(`
            INSERT INTO modular_packages (name, code, description, icon) VALUES 
            ('Coffee & Cafe', 'coffee_cafe', 'Standard setup for coffee shops and cafes', 'CoffeeOutlined'),
            ('Restaurant & Dining', 'restaurant', 'Full dining experience with table management', 'MdRestaurantMenu'),
            ('Grocery & Mart', 'mart', 'Fast retail and inventory focused', 'ShopOutlined')
        `);
        const coffeeId = res.insertId;
        const restId = coffeeId + 1;
        const martId = coffeeId + 2;

        // 4. Link some default permissions to these packages (Assuming IDs based on common keys)
        // Note: For real environment, we would lookup IDs first, but here we provide a blueprint
        await db.query(`
            INSERT IGNORE INTO package_permissions (package_id, permission_id)
            SELECT ?, id FROM permissions WHERE name IN ('pos', 'order', 'category', 'product', 'table')
        `, [coffeeId]);

        await db.query(`
            INSERT IGNORE INTO package_permissions (package_id, permission_id)
            SELECT ?, id FROM permissions WHERE name IN ('pos', 'order', 'category', 'product', 'table', 'kds')
        `, [restId]);

        await db.query(`
            INSERT IGNORE INTO package_permissions (package_id, permission_id)
            SELECT ?, id FROM permissions WHERE name IN ('pos', 'order', 'category', 'product', 'stock', 'supplier', 'purchase')
        `, [martId]);

        console.log("- Initialized industry blueprints (Coffee, Restaurant, Mart).");
        console.log("Migration Successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrate();
function getCurrentTimestamp() { return 'CURRENT_TIMESTAMP'; }
