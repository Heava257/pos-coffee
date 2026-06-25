const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/prime/Project-System/POS_Coffee/server/.env' });

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev_user',
        password: process.env.DB_PASSWORD || '88889999',
        database: process.env.DB_DATABASE || 'coffee_saas'
    });

    try {
        console.log("Starting Migration to add registration fields to businesses table...");

        // 1. Add shop_size column
        const [sizeCol] = await db.query("SHOW COLUMNS FROM businesses LIKE 'shop_size'");
        if (sizeCol.length === 0) {
            await db.query("ALTER TABLE businesses ADD COLUMN shop_size VARCHAR(50) NULL");
            console.log("Added column: shop_size");
        } else {
            console.log("Column shop_size already exists");
        }

        // 2. Add business_nature column
        const [natureCol] = await db.query("SHOW COLUMNS FROM businesses LIKE 'business_nature'");
        if (natureCol.length === 0) {
            await db.query("ALTER TABLE businesses ADD COLUMN business_nature VARCHAR(150) NULL");
            console.log("Added column: business_nature");
        } else {
            console.log("Column business_nature already exists");
        }

        // 3. Update register route code in auth.service to save these fields
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await db.end();
    }
}

migrate();
