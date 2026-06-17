const db = require("./src/util/connection");

async function migrate() {
  try {
    console.log("Using existing connection pool...");

    await db.query(`
      ALTER TABLE businesses 
      ADD COLUMN telegram_token VARCHAR(255) DEFAULT NULL, 
      ADD COLUMN telegram_chat_id VARCHAR(50) DEFAULT NULL;
    `);
    console.log("Columns added successfully.");

  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME' || error.message.includes("duplicate column name")) {
      console.log("Columns already exist.");
    } else {
      console.error("Migration failed:", error);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
