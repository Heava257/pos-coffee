require("dotenv").config();
const connection = require("./src/util/connection");

async function migrate() {
    try {
        console.log("🚀 Starting Database Migration for Support Masquerade...");
        
        await connection.query(`
            ALTER TABLE businesses 
            ADD COLUMN support_masquerade_token VARCHAR(255) DEFAULT NULL, 
            ADD COLUMN support_masquerade_expiry DATETIME DEFAULT NULL;
        `);
        console.log("✅ Added support_masquerade_token and support_masquerade_expiry to businesses table.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
        process.exit(1);
    }
}

migrate();
