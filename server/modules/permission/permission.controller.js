const { db, logError } = require("../../src/util/helper");

// 1. Get all available system permissions (filtered by plan)
exports.getAllPermissions = async (req, res) => {
    try {
        const { business_id, role_id } = req;
        const targetBizId = Number(req.query.target_business_id || business_id);

        let sql = `
            SELECT p.id, p.name, p.route_key, p.min_plan_id,
                   CASE 
                       WHEN ? = 1 THEN 1
                       WHEN EXISTS (
                           SELECT 1 FROM plan_permissions pp 
                           JOIN businesses b ON pp.plan_id = b.plan_id 
                           WHERE pp.permission_id = p.id AND b.id = ?
                       ) THEN 1
                       WHEN EXISTS (
                           SELECT 1 FROM module_permissions mp
                           JOIN system_modules sm ON mp.module_id = sm.id
                           JOIN businesses b ON FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', ''))
                           WHERE mp.permission_id = p.id AND b.id = ?
                       ) THEN 1
                       ELSE 0
                   END as is_allowed
            FROM permissions p
        `;
        let params = [targetBizId, targetBizId, targetBizId];

        if (business_id !== 1) {
            sql += " WHERE p.id IN (SELECT permission_id FROM role_permissions WHERE role_id = ?)";
            params.push(role_id);
        }

        sql += " ORDER BY p.name ASC";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("permission.getAllPermissions", error, res);
    }
};

// 2. Get permissions specifically for a role
exports.getRolePermissions = async (req, res) => {
    try {
        const { role_id } = req.params;
        const [list] = await db.query(
            "SELECT permission_id, can_view, can_create, can_edit, can_delete FROM role_permissions WHERE role_id = ?",
            [role_id]
        );
        res.json({ list });

    } catch (error) {
        logError("permission.getRolePermissions", error, res);
    }
};

// 3. Update permissions for a role
exports.updateRolePermissions = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { role_id, permissions } = req.body; // permissions = [{permission_id: 1, can_view: 1...}]
        const { business_id, role_id: my_role_id } = req;
        console.log(`Updating granular permissions for role ${role_id}`);

        let final_permissions = [];
        if (permissions && Array.isArray(permissions)) {
            final_permissions = permissions;
        }

        // Enforce strict hierarchy: non-system-admins can only grant permissions they themselves possess.
        if (business_id !== 1 && final_permissions.length > 0) {
            const [myPerms] = await conn.query(
                "SELECT permission_id FROM role_permissions WHERE role_id = ?",
                [my_role_id]
            );
            const myPermIds = myPerms.map(p => p.permission_id);
            // Filter out any requested permissions that the current user does not have
            final_permissions = final_permissions.filter(p => myPermIds.includes(p.permission_id));
        }

        // Clear existing permissions. 
        // Note: For strictness, if a role had an escalated permission that the current user DOES NOT have,
        // we can either leave it untouched or wipe it. Wiping it is safer to prevent broken states, 
        // but preserving it might be better? Actually, the simplest strict approach:
        // By deleting all, if the user shouldn't have it, it's purged. If the role had it, it's purged.
        await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [role_id]);

        // Insert new ones with granular flags
        if (final_permissions.length > 0) {
            const values = final_permissions.map(p => [
                role_id, 
                p.permission_id, 
                p.can_view ?? 1, 
                p.can_create ?? 0, 
                p.can_edit ?? 0, 
                p.can_delete ?? 0
            ]);
            
            await conn.query(
                "INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES ?",
                [values]
            );
        }

        // Check if editing a System Default template role
        const [roleData] = await conn.query("SELECT business_id, code FROM roles WHERE id = ?", [role_id]);
        if (roleData[0] && roleData[0].business_id === 1) {
            const roleCode = roleData[0].code;
            console.log(`Propagating System Default Role '${roleCode}' permissions to all businesses...`);

            // Fetch target roles of other businesses
            const [targetRoles] = await conn.query(
                "SELECT r.id as role_id, b.plan_id FROM roles r JOIN businesses b ON r.business_id = b.id WHERE r.code = ? AND r.business_id > 1",
                [roleCode]
            );

            if (targetRoles.length > 0) {
                // Fetch permission plan requirements to enforce plan restrictions
                const [permsList] = await conn.query("SELECT id, min_plan_id FROM permissions");
                const permPlanMap = {};
                permsList.forEach(p => {
                    permPlanMap[p.id] = p.min_plan_id || 1;
                });

                for (const target of targetRoles) {
                    // 1. Wipe existing permissions
                    await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [target.role_id]);

                    // 2. Filter permissions based on target business's active plan
                    const allowedPermissions = final_permissions.filter(p => {
                        const minPlan = permPlanMap[p.permission_id] || 1;
                        return minPlan <= target.plan_id;
                    });

                    if (allowedPermissions.length > 0) {
                        const targetValues = allowedPermissions.map(p => [
                            target.role_id,
                            p.permission_id,
                            p.can_view ?? 1,
                            p.can_create ?? 0,
                            p.can_edit ?? 0,
                            p.can_delete ?? 0
                        ]);

                        await conn.query(
                            "INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES ?",
                            [targetValues]
                        );
                    }
                }
            }
        }

        await conn.commit();

        // Clear permission cache to apply changes immediately
        try {
            require("../../middlewares/auth.middleware").clearCache();
        } catch (e) {}
        try {
            require("../../middlewares/auth.middleware").clearCache();
        } catch (e) {}

        res.json({ success: true, message: "Permissions updated successfully!" });
    } catch (error) {
        await conn.rollback();
        logError("permission.updateRolePermissions", error, res);
    } finally {
        conn.release();
    }
};
