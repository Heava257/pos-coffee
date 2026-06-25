require('dotenv').config();
const mysql = require("mysql2/promise");

async function seedMatrix() {
    let connection;
    try {
        console.log("Connecting to Local Database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'coffee_saas',
            port: process.env.DB_PORT || 3306
        });

        console.log("Cleaning old module permissions...");
        await connection.execute("DELETE FROM module_permissions");

        const mappings = {
            // Core POS System (Module ID: 1)
            1: [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15, 16, 17, 22, 23, 24, 31, 33],
            // Web QR Ordering (Module ID: 2)
            2: [25],
            // Advanced Inventory (Module ID: 3)
            3: [7, 8, 9, 20, 21]
        };

        const values = [];
        Object.keys(mappings).forEach(moduleId => {
            mappings[moduleId].forEach(permId => {
                values.push([Number(moduleId), Number(permId)]);
            });
        });

        if (values.length > 0) {
            console.log(`Inserting ${values.length} module-permission mappings...`);
            await connection.query("INSERT INTO module_permissions (module_id, permission_id) VALUES ?", [values]);
        }

        console.log("Database Seed completed successfully!");
    } catch (error) {
        console.error("Seed failed:", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

seedMatrix();
