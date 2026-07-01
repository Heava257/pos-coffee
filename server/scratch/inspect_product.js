const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  console.log("--- PRODUCT ID 176 DETAILS ---");
  const [rows] = await connection.execute("SELECT id, name, description, sizes, moods, addons FROM products WHERE id = 176");
  console.log(JSON.stringify(rows, null, 2));

  await connection.end();
}

check().catch(console.error);
