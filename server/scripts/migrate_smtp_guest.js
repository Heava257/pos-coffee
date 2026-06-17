const { db } = require("../src/util/helper");
require("dotenv").config();

async function migrate() {
    console.log("🚀 Starting database schema self-healing for SMTP & Guest Count...");
    try {
        // 1. Add SMTP columns to businesses
        const bizCols = [
            { name: "smtp_user", type: "VARCHAR(255) DEFAULT NULL" },
            { name: "smtp_pass", type: "VARCHAR(255) DEFAULT NULL" }
        ];

        for (const col of bizCols) {
            const [check] = await db.query(
                `SELECT COUNT(*) AS count 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = ?`,
                [col.name]
            );
            if (check[0].count === 0) {
                console.log(`Adding column 'businesses.${col.name}'...`);
                await db.query(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column 'businesses.${col.name}' already exists.`);
            }
        }

        // 2. Add guest_count column to orders
        const [check] = await db.query(
            `SELECT COUNT(*) AS count 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'guest_count'`
        );
        if (check[0].count === 0) {
            console.log("Adding column 'orders.guest_count'...");
            await db.query("ALTER TABLE orders ADD COLUMN guest_count INT DEFAULT 1");
        } else {
            console.log("Column 'orders.guest_count' already exists.");
        }

        console.log("✅ SMTP and Guest Count schema self-healing completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
