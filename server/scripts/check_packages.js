const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/prime/Project-System/POS_Coffee/server/.env' });

async function check() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev_user',
        password: process.env.DB_PASSWORD || '88889999',
        database: process.env.DB_DATABASE || 'coffee_saas'
    });

    try {
        console.log("Checking columns of modular_packages...");
        const [cols] = await db.query("SHOW COLUMNS FROM modular_packages");
        console.log("Columns:", cols);

        console.log("Checking columns of businesses...");
        const [bizCols] = await db.query("SHOW COLUMNS FROM businesses");
        console.log("Businesses columns:", bizCols.map(c => c.Field));
    } catch (error) {
        console.error("Error checking database:", error);
    } finally {
        await db.end();
    }
}

check();
