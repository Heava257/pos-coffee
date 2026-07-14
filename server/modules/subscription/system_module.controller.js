const { db, logError } = require("../../src/util/helper");

exports.getList = async (req, res) => {
    try {
        const sql = "SELECT * FROM system_modules ORDER BY id ASC";
        const [list] = await db.query(sql);
        res.json({ list });
    } catch (error) {
        logError("system_module.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { name, code, description, status } = req.body;
        
        const [result] = await db.query(
            "INSERT INTO system_modules (name, code, description, status) VALUES (?, ?, ?, ?)",
            [name, code, description, status || 'active']
        );
        res.json({ success: true, message: "Module created successfully", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Module code already exists!" });
        }
        logError("system_module.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id, name, code, description, status } = req.body;
        
        await db.query(
            "UPDATE system_modules SET name = ?, code = ?, description = ?, status = ? WHERE id = ?",
            [name, code, description, status, id]
        );
        res.json({ success: true, message: "Module updated successfully" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Module code already exists!" });
        }
        logError("system_module.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id } = req.body;
        
        await db.query("DELETE FROM system_modules WHERE id = ?", [id]);
        res.json({ success: true, message: "Module deleted successfully" });
    } catch (error) {
        logError("system_module.remove", error, res);
    }
};

exports.getPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "SELECT permission_id FROM module_permissions WHERE module_id = ?";
        const [rows] = await db.query(sql, [id]);
        res.json({ list: rows.map(r => r.permission_id) });
    } catch (error) {
        logError("system_module.getPermissions", error, res);
    }
};

exports.savePermissions = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id } = req.params;
        const { permissions } = req.body; // Array of permission IDs

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Delete existing permissions for this module
            await conn.query("DELETE FROM module_permissions WHERE module_id = ?", [id]);

            // 2. Insert new permissions
            if (permissions && permissions.length > 0) {
                const values = permissions.map(p_id => [id, p_id]);
                await conn.query("INSERT INTO module_permissions (module_id, permission_id) VALUES ?", [values]);
            }

            await conn.commit();
            res.json({ success: true, message: "Module permissions updated successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("system_module.savePermissions", error, res);
    }
};

exports.getMatrix = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });

        // 1. Get all Permissions
        const [perms] = await db.query("SELECT id, name, route_key FROM permissions ORDER BY id ASC");
        
        // 2. Get all Plans
        const [plans] = await db.query("SELECT id, name FROM subscription_plans ORDER BY id ASC");
        
        // 3. Get all Modules
        const [modules] = await db.query("SELECT id, name, code FROM system_modules ORDER BY id ASC");
        
        // 4. Get Plan-Permission mappings
        const [planPerms] = await db.query("SELECT plan_id, permission_id FROM plan_permissions");
        
        // 5. Get Module-Permission mappings
        const [modulePerms] = await db.query("SELECT module_id, permission_id FROM module_permissions");

        res.json({
            permissions: perms,
            plans: plans,
            modules: modules,
            plan_permissions: planPerms,
            module_permissions: modulePerms,
            success: true
        });
    } catch (error) {
        logError("system_module.getMatrix", error, res);
    }
};

exports.saveMatrix = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { plan_mappings, module_mappings } = req.body; 

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Handle Plan Mappings
            if (plan_mappings) {
                await conn.query("DELETE FROM plan_permissions");
                const values = [];
                Object.keys(plan_mappings).forEach(plan_id => {
                    plan_mappings[plan_id].forEach(p_id => {
                        values.push([plan_id, p_id]);
                    });
                });
                if (values.length > 0) {
                    await conn.query("INSERT INTO plan_permissions (plan_id, permission_id) VALUES ?", [values]);
                }
            }

            // Handle Module Mappings
            if (module_mappings) {
                await conn.query("DELETE FROM module_permissions");
                const values = [];
                Object.keys(module_mappings).forEach(module_id => {
                    module_mappings[module_id].forEach(p_id => {
                        values.push([module_id, p_id]);
                    });
                });
                if (values.length > 0) {
                    await conn.query("INSERT INTO module_permissions (module_id, permission_id) VALUES ?", [values]);
                }
            }

            await conn.commit();
            
            // 🚀 HYPER-SYNC: Clear Backend Cache so changes take effect immediately
            try {
                require("../../middlewares/auth.middleware").clearCache();
            } catch (e) {}
            try {
                require("../../middlewares/auth.middleware").clearCache();
            } catch (e) {}

            res.json({ success: true, message: "Permission Matrix saved successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("system_module.saveMatrix", error, res);
    }
};
