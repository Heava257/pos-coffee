const { db } = require("../src/util/helper");

async function reactivateBusiness() {
  try {
    const businessId = 1; // admin@gmail.com belongs to business 1
    
    console.log(`Checking status for Business ID: ${businessId}`);
    const [rows] = await db.query("SELECT id, name, status FROM businesses WHERE id = ?", [businessId]);
    
    if (rows.length === 0) {
      console.log("❌ Business not found!");
      process.exit(1);
    }
    
    console.log("Current status:", rows[0].status);
    
    if (rows[0].status !== 'active') {
      console.log("Updating status to 'active'...");
      await db.query("UPDATE businesses SET status = 'active' WHERE id = ?", [businessId]);
      console.log("✅ Business Reactivated Successfully!");
    } else {
      console.log("ℹ️ Business is already active.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

reactivateBusiness();
