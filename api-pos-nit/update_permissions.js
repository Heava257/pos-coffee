const { db } = require("./src/util/helper");

const updatePermissions = async () => {
    try {
        console.log("🚀 Updating Permissions...");

        // 1. Define new permissions to add
        const newPermissions = [
            { name: "raw_material", group: "Inventory", web_route_key: "/raw_material" },
            { name: "purchase", group: "Purchase", web_route_key: "/purchase" },
            { name: "supplier", group: "Purchase", web_route_key: "/supplier" },
            { name: "recipe", group: "Product", web_route_key: "/recipe" }
        ];

        for (const p of newPermissions) {
            // Check if exists
            const [exists] = await db.query("SELECT id FROM permissions WHERE web_route_key = ?", [p.web_route_key]);

            if (exists.length === 0) {
                console.log(`+ Adding permission: ${p.name}`);
                const [result] = await db.query(
                    "INSERT INTO permissions (name, `group`, web_route_key, is_menu_web) VALUES (?, ?, ?, 1)",
                    [p.name, p.group, p.web_route_key]
                );

                const permissionId = result.insertId;

                // 2. Grant this permission to Role ID 1 (Owner/Admin) automatically
                await db.query(
                    "INSERT INTO permission_roles (role_id, permission_id) SELECT id, ? FROM role WHERE id = 1",
                    [permissionId]
                );
            } else {
                // Ensure it is linked to Role ID 1
                const permissionId = exists[0].id;
                const [linkExists] = await db.query(
                    "SELECT * FROM permission_roles WHERE role_id = 1 AND permission_id = ?",
                    [permissionId]
                );
                if (linkExists.length === 0) {
                    await db.query("INSERT INTO permission_roles (role_id, permission_id) VALUES (1, ?)", [permissionId]);
                    console.log(`  > Linked ${p.name} to Role 1`);
                }
            }
        }

        console.log("✅ Permissions updated successfully!");
    } catch (error) {
        console.error("❌ Error updating permissions:", error);
    }
};

module.exports = updatePermissions;
