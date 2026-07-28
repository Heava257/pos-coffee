require('dotenv').config();
const mysql = require("mysql2/promise");

async function seedDevopsPermissions() {
    let connection;
    try {
        console.log("Connecting to Database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'coffee_saas',
            port: process.env.DB_PORT || 3306
        });

        console.log("Starting DevOps Permissions Seeding...");

        const devopsPermissions = [
            { name: "DevOps: Deployment History", route_key: "/devops-deployment-history" },
            { name: "DevOps: Version Management", route_key: "/devops-version-management" },
            { name: "DevOps: Environment Configuration", route_key: "/devops-environment" },
            { name: "DevOps: System Health Checks", route_key: "/devops-health-checks" },
            { name: "DevOps: Docker Node Status", route_key: "/devops-docker-status" },
            { name: "DevOps: Kubernetes Pods Status", route_key: "/devops-kubernetes-status" },
            { name: "DevOps: Queue Monitoring & Metrics", route_key: "/devops-queue-monitoring" },
            { name: "DevOps: Advanced Feature Flags", route_key: "/devops-feature-flags" },
            { name: "DevOps: Maintenance Mode Controller", route_key: "/devops-maintenance-mode" }
        ];

        // 1. Insert permissions
        const seededPermIds = [];
        for (const p of devopsPermissions) {
            const [check] = await connection.execute(
                "SELECT id FROM permissions WHERE route_key = ?",
                [p.route_key]
            );

            let permId;
            if (check.length === 0) {
                console.log(`Adding permission: ${p.name}`);
                const [result] = await connection.execute(
                    "INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
                    [p.name, p.route_key, 1]
                );
                permId = result.insertId;
            } else {
                console.log(`Permission already exists: ${p.name}`);
                permId = check[0].id;
                // Update name just in case
                await connection.execute(
                    "UPDATE permissions SET name = ? WHERE id = ?",
                    [p.name, permId]
                );
            }
            seededPermIds.push(permId);
        }

        // 2. Grant all seeded DevOps permissions to Owner & Super Admin roles
        console.log("Granting DevOps permissions to Owner and Super Admin/Platform Owner roles...");
        const [roles] = await connection.execute(
            "SELECT id FROM roles WHERE name IN ('Owner', 'Super Admin', 'Platform Owner') OR code IN ('owner', 'super_admin', 'platform_owner')"
        );

        for (const role of roles) {
            console.log(`Granting to role ID: ${role.id}`);
            for (const pId of seededPermIds) {
                await connection.execute(
                    "INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)",
                    [role.id, pId]
                );
            }
        }

        console.log("DevOps Permissions Seeding completed successfully!");
    } catch (error) {
        console.error("Seeding failed:", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

seedDevopsPermissions();
