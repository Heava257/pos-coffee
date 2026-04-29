const connection = require("./src/util/connection");

async function migrate() {
    try {
        console.log("🚀 Starting Database Migration...");
        
        // 1. Add verification columns to users
        await connection.query(`
            ALTER TABLE users 
            ADD COLUMN is_verified TINYINT(1) DEFAULT 0, 
            ADD COLUMN verify_token VARCHAR(255) DEFAULT NULL;
        `);
        console.log("✅ Added is_verified and verify_token to users table.");

        // 2. Set existing users as verified (so they don't get locked out)
        await connection.query("UPDATE users SET is_verified = 1;");
        console.log("✅ Existing users marked as verified.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
        process.exit(1);
    }
}

migrate();
