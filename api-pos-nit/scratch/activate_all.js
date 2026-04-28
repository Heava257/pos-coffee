const { db } = require("../src/util/helper");

async function activateAll() {
  try {
    console.log("Activating all businesses and users...");
    await db.query("UPDATE businesses SET status = 'active'");
    await db.query("UPDATE users SET status = 'active'");
    console.log("✅ All Accounts Reactivated!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

activateAll();
