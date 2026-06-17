const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  console.log("--- PERMISSIONS COLUMNS ---");
  const [cols] = await connection.execute("SHOW COLUMNS FROM permissions");
  console.table(cols);

  await connection.end();
}

check().catch(console.error);
