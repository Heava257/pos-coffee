const { db } = require("./src/util/helper");

async function fixPermissions() {
    try {
        console.log("Checking for service-blueprints permission...");

        // 1. Check if permission exists
        const [existing] = await db.query("SELECT id FROM permissions WHERE route_key = '/service-blueprints'");
        let permId;

        if (existing.length === 0) {
            console.log("Inserting service-blueprints permission...");
            const [res] = await db.query(
                "INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
                ['Service Blueprints', '/service-blueprints', 1]
            );
            permId = res.insertId;
        } else {
            permId = existing[0].id;
        }

        console.log(`Permission ID for Service Blueprints is ${permId}`);

        // 2. Find Platform Admin Role Profile
        const [roles] = await db.query("SELECT id FROM roles WHERE business_id = 1");
        
        console.log(`Found ${roles.length} roles for Platform Admin (Business ID 1). Granting access...`);

        // 3. Grant access
        for (const role of roles) {
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, permId]);
            console.log(`Granted to Role ID ${role.id}`);
        }

        console.log("Successfully placed permission in DB.");
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
}

fixPermissions();
