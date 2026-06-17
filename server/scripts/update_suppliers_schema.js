require('dotenv').config();
const mysql = require("mysql2/promise");

async function updateSuppliersSchema() {
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

        console.log("Adding missing columns to 'suppliers' table...");
        
        // 1. Add missing columns: code, tel, email, website, note
        // Rename 'phone' to 'tel' if it exists, or just add tel
        try {
            await connection.execute("ALTER TABLE suppliers ADD COLUMN code VARCHAR(50) AFTER business_id");
            console.log("- Added 'code' column.");
        } catch (e) { console.log("- 'code' column might already exist."); }

        try {
            // Attempt to rename phone to tel or just add tel
            await connection.execute("ALTER TABLE suppliers CHANGE COLUMN phone tel VARCHAR(50)");
            console.log("- Renamed 'phone' to 'tel'.");
        } catch (e) {
            try {
                await connection.execute("ALTER TABLE suppliers ADD COLUMN tel VARCHAR(50) AFTER name");
                console.log("- Added 'tel' column.");
            } catch (ee) { }
        }

        try {
            await connection.execute("ALTER TABLE suppliers ADD COLUMN email VARCHAR(150) AFTER tel");
            console.log("- Added 'email' column.");
        } catch (e) { }

        try {
            await connection.execute("ALTER TABLE suppliers ADD COLUMN website VARCHAR(255) AFTER address");
            console.log("- Added 'website' column.");
        } catch (e) { }

        try {
            await connection.execute("ALTER TABLE suppliers ADD COLUMN note TEXT AFTER website");
            console.log("- Added 'note' column.");
        } catch (e) { }

        console.log("Suppliers schema updated successfully!");
    } catch (error) {
        console.error("Update failed:", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

updateSuppliersSchema();
