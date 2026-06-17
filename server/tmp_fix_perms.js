const mysql = require('mysql2/promise');
async function run() {
  const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'coffee_saas'
  };
  try {
    const db = await mysql.createConnection(config);
    // 1. Find the roles like 'Sale'
    const [roles] = await db.query("SELECT id FROM roles WHERE name LIKE '%Sale%' OR name LIKE '%Staff%'");
    
    // 2. Find necessary permissions
    const [perms] = await db.query("SELECT id FROM permissions WHERE route_key IN ('/category', '/product', '/invoices', '/order')");
    
    console.log(`Found roles: ${roles.length}, permissions: ${perms.length}`);
    
    for (const r of roles) {
      for (const p of perms) {
        // Insert if not exists
        await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [r.id, p.id]);
      }
    }
    console.log("Permissions updated successfully.");
    await db.end();
  } catch (err) {
    console.error(err.message);
  }
}
run();
