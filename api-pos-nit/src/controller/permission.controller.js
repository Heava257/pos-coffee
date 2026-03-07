const { db, logError } = require("../util/helper");

// 1. Get all available system permissions (filtered by plan)
exports.getAllPermissions = async (req, res) => {
    try {
        const { business_id } = req;
        // System Admin sees all
        let sql = "SELECT id, name, route_key, min_plan_id FROM permissions";
        let params = [];

        if (business_id !== 1) {
            sql += " WHERE min_plan_id <= (SELECT plan_id FROM businesses WHERE id = ?)";
            params.push(business_id);
        }

        sql += " ORDER BY name ASC";

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
            "SELECT permission_id FROM role_permissions WHERE role_id = ?",
            [role_id]
        );
        res.json({ list: list.map(item => item.permission_id) });
    } catch (error) {
        logError("permission.getRolePermissions", error, res);
    }
};

// 3. Update permissions for a role
exports.updateRolePermissions = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { role_id, permission_ids } = req.body; // permission_ids = [1, 2, 3...]
        console.log(`Updating permissions for role ${role_id}:`, permission_ids);

        // Clear existing permissions
        await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [role_id]);

        // Insert new ones
        if (permission_ids && Array.isArray(permission_ids) && permission_ids.length > 0) {
            const values = permission_ids.map(p_id => [role_id, p_id]);
            // Bulk insert: mysql2 expects [ [ [v1,v2], [v1,v2] ] ]
            await conn.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
                [values]
            );
        }

        await conn.commit();
        res.json({ success: true, message: "Permissions updated successfully!" });
    } catch (error) {
        await conn.rollback();
        logError("permission.updateRolePermissions", error, res);
    } finally {
        conn.release();
    }
};
