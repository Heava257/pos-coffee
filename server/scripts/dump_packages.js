const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/prime/Project-System/POS_Coffee/server/.env' });

async function dump() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev_user',
        password: process.env.DB_PASSWORD || '88889999',
        database: process.env.DB_DATABASE || 'coffee_saas'
    });

    try {
        console.log("Dumping modular_packages...");
        const [rows] = await db.query("SELECT * FROM modular_packages");
        console.log("Rows:", rows);
    } catch (error) {
        console.error("Error dumping packages:", error);
    } finally {
        await db.end();
    }
}

dump();
