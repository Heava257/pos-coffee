const mysql = require("mysql2/promise");

async function syncPermissions() {
    console.log("Connecting to Railway Database...");
    // Connection string from your Railway configuration
    const connectionString = "mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway";

    const connection = await mysql.createConnection(connectionString);
    try {
        console.log("Starting Permission Sync on Railway...");

        // 1. Ensure System Settings exists
        const [settingsCheck] = await connection.execute(
            "SELECT id FROM permissions WHERE route_key = '/settings' OR name = 'System Settings'"
        );
        if (settingsCheck.length === 0) {
            console.log("Adding missing permission: System Settings");
            await connection.execute(
                "INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
                ["System Settings", "/settings", 1]
            );
        } else {
            // Update name and route_key to be standard
            await connection.execute(
                "UPDATE permissions SET name = 'System Settings', route_key = '/settings' WHERE id = ?",
                [settingsCheck[0].id]
            );
        }

        // 2. Ensure Dashboard route is consistent
        console.log("Syncing Dashboard route to '/dashboard' for consistency...");
        await connection.execute(
            "UPDATE permissions SET route_key = '/dashboard' WHERE name = 'Dashboard'"
        );

        // 3. Grant ALL permissions to all roles named 'Owner' or 'Super Admin'
        console.log("Granting all permissions to Owner and Super Admin roles...");
        const [roles] = await connection.execute(
            "SELECT id FROM roles WHERE name IN ('Owner', 'Super Admin') OR code IN ('owner', 'super_admin')"
        );

        for (const role of roles) {
            // Get all permission IDs
            const [allPerms] = await connection.execute("SELECT id FROM permissions");
            const permIds = allPerms.map(p => p.id);

            for (const pId of permIds) {
                try {
                    await connection.execute(
                        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                        [role.id, pId]
                    );
                } catch (err) {
                    // Ignore duplicates
                }
            }
        }

        console.log("Permission Sync completed successfully!");
    } catch (error) {
        console.error("Sync failed:", error);
    } finally {
        await connection.end();
        process.exit();
    }
}

syncPermissions();
