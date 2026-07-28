require("dotenv").config();
const db = require("../config/database");

async function check() {
  try {
    const [payments] = await db.query("SELECT * FROM payments ORDER BY id DESC LIMIT 10");
    console.log("PAYMENTS:", payments);
    
    const [subs] = await db.query(`
      SELECT s.*, sp.name as plan_name 
      FROM subscriptions s 
      JOIN subscription_plans sp ON s.plan_id = sp.id 
      ORDER BY s.id DESC LIMIT 10
    `);
    console.log("SUBSCRIPTIONS:", subs);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
