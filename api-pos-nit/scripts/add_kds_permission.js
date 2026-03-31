require('dotenv').config();
const mysql = require("mysql2/promise");

async function addKDSPermission() {
    let connection;
    try {
        console.log("Connecting to Local Database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'coffee_saas',
            port: process.env.DB_PORT || 3306
        });

        console.log("Checking if Kitchen (KDS) permission exists...");
        const [kdsCheck] = await connection.execute(
            "SELECT id FROM permissions WHERE route_key = '/kds' OR name = 'Kitchen (KDS)'"
        );

        let kdsId;
        if (kdsCheck.length === 0) {
            console.log("Adding missing permission: Kitchen (KDS)");
            const [result] = await connection.execute(
                "INSERT INTO permissions (name, route_key) VALUES (?, ?)",
                ["Kitchen (KDS)", "/kds"]
            );
            kdsId = result.insertId;
        } else {
            console.log("Kitchen (KDS) permission already exists.");
            kdsId = kdsCheck[0].id;
        }

        // Grant ALL permissions to all roles named 'Owner' or 'Super Admin'
        console.log("Granting KDS permission to all Owner/Admin roles...");
        const [roles] = await connection.execute(
            "SELECT id FROM roles WHERE name IN ('Owner', 'Super Admin') OR code IN ('owner', 'super_admin')"
        );

        for (const role of roles) {
            console.log(`Granting KDS (ID: ${kdsId}) to role ID: ${role.id}`);
            try {
                await connection.execute(
                    "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                    [role.id, kdsId]
                );
            } catch (err) {
                console.error(`Failed to grant to role ${role.id}:`, err.message);
            }
        }

        console.log("Kitchen (KDS) permission setup completed successfully!");
    } catch (error) {
        console.error("Setup failed:", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

addKDSPermission();
