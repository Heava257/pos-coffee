require('dotenv').config();
const db = require('../src/util/connection');

async function main() {
  try {
    const [roles] = await db.query("SELECT * FROM roles");
    console.log("Roles:");
    console.table(roles);

    const [rolePermCount] = await db.query("SELECT role_id, COUNT(*) as count FROM role_permissions GROUP BY role_id");
    console.log("\nRole Permissions count per role:");
    console.table(rolePermCount);

    const [sampleRolePerms] = await db.query(`
      SELECT rp.role_id, r.name as role_name, rp.permission_id, p.name as perm_name, p.route_key, rp.can_view, rp.can_create, rp.can_edit, rp.can_delete 
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      LIMIT 10
    `);
    console.log("\nSample Role Permissions:");
    console.table(sampleRolePerms);
  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    await db.end();
  }
}

main();
