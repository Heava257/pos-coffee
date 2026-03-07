const { db } = require('./src/util/helper');

async function migrate() {
    try {
        console.log("Starting migration...");

        // Add new columns to businesses table for settings
        const columns = [
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_percent DECIMAL(5,2) DEFAULT 0",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_charge DECIMAL(5,2) DEFAULT 0",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS kh_exchange_rate INT DEFAULT 4100",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website VARCHAR(255)",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '$'",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS telegram_link VARCHAR(255)",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_link VARCHAR(255)"
        ];

        for (const sql of columns) {
            try {
                await db.query(sql);
                console.log(`Executed: ${sql.substring(0, 50)}...`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping.`);
                } else {
                    throw e;
                }
            }
        }

        console.log("Migration finished successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
