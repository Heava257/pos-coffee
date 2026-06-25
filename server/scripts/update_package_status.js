const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/prime/Project-System/POS_Coffee/server/.env' });

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev_user',
        password: process.env.DB_PASSWORD || '88889999',
        database: process.env.DB_DATABASE || 'coffee_saas'
    });

    try {
        console.log("Updating modular_packages statuses...");
        
        // Update all other packages to 'inactive' except coffee_cafe
        const [res] = await db.query(
            "UPDATE modular_packages SET status = 'inactive' WHERE code != 'coffee_cafe' OR code IS NULL"
        );
        console.log(`Updated ${res.affectedRows} packages to inactive.`);
        
        // Make sure coffee_cafe is 'active'
        const [resActive] = await db.query(
            "UPDATE modular_packages SET status = 'active' WHERE code = 'coffee_cafe'"
        );
        console.log(`Set coffee_cafe to active: ${resActive.affectedRows} row updated.`);

        const [rows] = await db.query("SELECT id, name, code, status FROM modular_packages");
        console.log("Updated state:", rows);
    } catch (error) {
        console.error("Error updating statuses:", error);
    } finally {
        await db.end();
    }
}

run();
