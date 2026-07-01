require('dotenv').config();
const { db } = require("./src/util/helper");

async function main() {
  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = 'Pheak990@gmail.com'");
    console.log("Logged-in user:", user);

    if (user.length > 0) {
      const [role] = await db.query("SELECT * FROM roles WHERE id = ?", [user[0].role_id]);
      console.log("User role:", role);

      const [rolePerms] = await db.query(`
        SELECT rp.*, p.name, p.route_key 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [user[0].role_id]);
      console.log("User role permissions count:", rolePerms.length);
      console.log("User role permissions list:", rolePerms.map(p => `${p.name} (${p.route_key})`));
    }

    const [allPerms] = await db.query("SELECT * FROM permissions");
    console.log("\nAll system permissions count:", allPerms.length);
    console.log("All system permissions list:", allPerms.map(p => `${p.id}: ${p.name} (${p.route_key})`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
