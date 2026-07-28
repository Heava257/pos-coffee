require("dotenv").config();
const db = require("../config/database");

async function run() {
  try {
    const [columns] = await db.query("DESCRIBE system_settings");
    console.log("COLUMNS:", columns);
    
    // Check if key exists
    const [rows] = await db.query("SELECT * FROM system_settings WHERE sett_key = 'payway_allow_simulation'");
    if (rows.length === 0) {
      // Find what columns exist and build insert statement
      const colNames = columns.map(c => c.Field);
      let sql = "";
      let params = [];
      
      if (colNames.includes("is_public")) {
        sql = "INSERT INTO system_settings (sett_key, sett_value, is_public) VALUES (?, ?, ?)";
        params = ["payway_allow_simulation", "false", 1];
      } else {
        sql = "INSERT INTO system_settings (sett_key, sett_value) VALUES (?, ?)";
        params = ["payway_allow_simulation", "false"];
      }
      
      await db.query(sql, params);
      console.log("Inserted 'payway_allow_simulation' key with default value 'false'.");
    } else {
      console.log("'payway_allow_simulation' key already exists:", rows[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
