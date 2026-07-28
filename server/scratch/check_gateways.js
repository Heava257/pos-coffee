require("dotenv").config();
const db = require("../config/database");

async function check() {
  try {
    const [rows] = await db.query("SELECT * FROM payment_gateways");
    console.log("GATEWAYS:", rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
