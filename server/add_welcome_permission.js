require('dotenv').config();
const { db } = require("./src/util/helper");

async function addPermission() {
    try {
        // 1. Insert Permission for Shop Landing Page
        const [permRes] = await db.query(
            "INSERT IGNORE INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
            ['Shop Landing Page', '/welcome', 1]
        );

        let permId = permRes.insertId;
        if (permId === 0) {
            const [existing] = await db.query("SELECT id FROM permissions WHERE route_key = '/welcome'");
            permId = existing[0]?.id;
        }

        if (permId) {
            console.log("Permission ID for /welcome:", permId);
            // 2. Assign to all roles
            const [roles] = await db.query("SELECT id FROM roles");
            for (const role of roles) {
                await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, permId]);
            }
            console.log("Assigned welcome permission to all roles successfully!");
        }
        process.exit(0);
    } catch (error) {
        console.error("Failed to insert welcome permission:", error);
        process.exit(1);
    }
}

addPermission();
