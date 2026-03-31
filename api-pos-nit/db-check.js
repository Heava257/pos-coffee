const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  console.log("--- PERMISSIONS TABLE ---");
  const [perms] = await connection.execute("SELECT id, name, route_key, web_route_key FROM permissions");
  console.table(perms);

  console.log("\n--- SUPER ADMIN (ROLE ID 1) PERMISSIONS ---");
  const [rolePerms] = await connection.execute(`
    SELECT p.name, p.web_route_key, rp.can_view, rp.can_create, rp.can_edit, rp.can_delete 
    FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.id 
    WHERE rp.role_id = 1
  `);
  console.table(rolePerms);

  await connection.end();
}

check().catch(console.error);
