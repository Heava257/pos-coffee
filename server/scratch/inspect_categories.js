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

  console.log("--- ALL CATEGORIES ---");
  const [rows] = await connection.execute("SELECT id, name, default_moods, default_sizes, default_addons, industry_code FROM categories");
  console.log(JSON.stringify(rows, null, 2));

  await connection.end();
}

check().catch(console.error);
