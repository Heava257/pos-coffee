const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Starting Step 1 Migration: Modular SaaS...");

        // 1. Add active_modules column to businesses
        // We use TEXT to store a list like 'POS,ORDERING,ADV_INV' or JSON string
        await db.query(`
            ALTER TABLE businesses 
            ADD COLUMN active_modules TEXT DEFAULT 'POS' AFTER plan_type
        `);
        console.log("- Added active_modules column.");

        // 2. Update businesses plan_type column to support new tiers
        // In MySQL, modifying an ENUM usually requires re-defining it
        await db.query(`
            ALTER TABLE businesses 
            MODIFY COLUMN plan_type ENUM('basic', 'standard', 'premium') DEFAULT 'basic'
        `);
        console.log("- Updated businesses.plan_type to [basic, standard, premium].");

        // 3. Update subscriptions plan_type column
        await db.query(`
            ALTER TABLE subscriptions 
            MODIFY COLUMN plan_type ENUM('basic', 'standard', 'premium') NOT NULL
        `);
        console.log("- Updated subscriptions.plan_type to [basic, standard, premium].");

        // 4. Update existing records to default values
        await db.query("UPDATE businesses SET plan_type = 'standard', active_modules = 'POS' WHERE plan_type IS NULL OR plan_type = ''");
        await db.query("UPDATE subscriptions SET plan_type = 'standard' WHERE plan_type IS NULL OR plan_type = ''");
        
        console.log("Migration Successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrate();
