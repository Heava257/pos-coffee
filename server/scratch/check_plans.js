require("dotenv").config();
const db = require("../config/database");

async function check() {
  try {
    const [plans] = await db.query("SELECT * FROM subscription_plans");
    console.log("PLANS:", plans);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
