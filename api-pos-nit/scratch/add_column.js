const { db } = require("../src/util/helper");

async function run() {
    try {
        console.log("Adding kitchen_batch_id to order_details...");
        await db.query("ALTER TABLE order_details ADD COLUMN kitchen_batch_id VARCHAR(50) DEFAULT NULL;");
        console.log("Success!");
    } catch (e) {
        console.error("Error adding column:", e.message);
    } finally {
        process.exit();
    }
}

run();
