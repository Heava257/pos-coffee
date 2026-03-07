const { db } = require('./src/util/helper');

async function addPermission() {
    try {
        const name = "System Settings";
        const key = "/settings";

        const [exists] = await db.query("SELECT id FROM permissions WHERE route_key = ?", [key]);

        if (exists.length === 0) {
            await db.query("INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)", [name, key, 1]);
            console.log("Added /settings permission");

            // Auto-assign to existing 'Super Admin' or 'OWNER' roles
            const [roles] = await db.query("SELECT id FROM roles WHERE code = 'super_admin' OR name LIKE '%OWNER%'");
            const [newPerm] = await db.query("SELECT id FROM permissions WHERE route_key = ?", [key]);
            const permId = newPerm[0].id;

            for (const role of roles) {
                await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, permId]);
                console.log(`Assigned /settings to role ID ${role.id}`);
            }

        } else {
            console.log("/settings permission already exists");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addPermission();
