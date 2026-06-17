require('dotenv').config();
const { db } = require("./src/util/helper");

async function cleanup() {
    try {
        // Platform Owner role id is 1
        const platformOwnerRoleId = 1;

        // Route keys that a Platform Owner should NOT have access to
        const forbiddenRoutes = [
            '/invoices',
            '/order',
            '/kds',
            '/product',
            '/supplier',
            '/purchase',
            '/raw_material',
            '/stock',
            'stock/adjust',
            '/table',
            '/Top_Sale',
            '/report_Sale_Summary',
            '/report_Expense_Summary',
            '/expense',
            '/my-plan',
            'marketing/dashboard',
            '/welcome'
        ];

        console.log("Cleaning up Platform Owner permissions in database...");

        // Find permission IDs for these forbidden routes
        const [perms] = await db.query(
            "SELECT id, name, route_key FROM permissions WHERE route_key IN (?)",
            [forbiddenRoutes]
        );

        const permIds = perms.map(p => p.id);

        if (permIds.length > 0) {
            // Delete from role_permissions for platform owner role
            const [delRes] = await db.query(
                "DELETE FROM role_permissions WHERE role_id = ? AND permission_id IN (?)",
                [platformOwnerRoleId, permIds]
            );
            console.log(`Deleted ${delRes.affectedRows} forbidden permissions for Platform Owner role.`);
        } else {
            console.log("No matching forbidden permissions found in DB.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanup();
