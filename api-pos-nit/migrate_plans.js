const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'dev_user', password: '88889999', database: 'coffee_saas'
    });

    try {
        console.log("Starting Migration...");

        // 1. Create subscription_plans table
        await db.query(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                max_branches INT DEFAULT 1,
                max_staff INT DEFAULT 2,
                max_products INT DEFAULT 50,
                price DECIMAL(10, 2) DEFAULT 0.00,
                is_active TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Clear and Insert initial plans
        await db.query("DELETE FROM subscription_plans");
        await db.query(`
            INSERT INTO subscription_plans (name, max_branches, max_staff, max_products, price) VALUES 
            ('Small (Starter)', 1, 2, 50, 0.00),
            ('Medium (Professional)', 5, 10, 500, 30.00),
            ('Large (Enterprise)', 999, 999, 9999, 800.00)
        `);

        // 3. Update businesses table to use plan_id
        // First check if plan_id exists
        const [columns] = await db.query("SHOW COLUMNS FROM businesses LIKE 'plan_id'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE businesses ADD COLUMN plan_id INT DEFAULT 1");
        }

        // Set default plan_id for existing businesses based on their plan_type
        await db.query("UPDATE businesses SET plan_id = 1 WHERE plan_type = 'free' OR plan_type IS NULL");
        await db.query("UPDATE businesses SET plan_id = 2 WHERE plan_type = 'pro'");

        console.log("Migration Successful!");
    } catch (error) {
        console.error("Migration Failed:", error);
    } finally {
        await db.end();
    }
}

migrate();
