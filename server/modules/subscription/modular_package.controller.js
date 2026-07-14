const { db, logError } = require("../../src/util/helper");

// 1. Get all modular packages
exports.getList = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        
        const sql = `
            SELECT mp.*, 
                   (SELECT COUNT(*) FROM package_permissions WHERE package_id = mp.id) as total_permissions
            FROM modular_packages mp 
            ORDER BY mp.id DESC
        `;
        const [list] = await db.query(sql);
        res.json({ list });
    } catch (error) {
        logError("modular_package.getList", error, res);
    }
};

// Get active modular packages publicly
exports.getListPublic = async (req, res) => {
    try {
        const sql = `
            SELECT id, name, code, description, icon, ui_layout, status, industry_code
            FROM modular_packages 
            ORDER BY id ASC
        `;
        const [list] = await db.query(sql);
        res.json({ list, success: true });
    } catch (error) {
        logError("modular_package.getListPublic", error, res);
    }
};

// 2. Create new package
exports.create = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        
        const { name, code, industry_code, description, icon, permission_ids } = req.body;
        
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // A. Create Package
            const [pkg] = await conn.query(
                "INSERT INTO modular_packages (name, code, industry_code, description, icon) VALUES (?, ?, ?, ?, ?)",
                [name, code, industry_code || 'coffee_cafe', description, icon]
            );
            const package_id = pkg.insertId;
            
            // B. Link Permissions
            if (Array.isArray(permission_ids) && permission_ids.length > 0) {
                const values = permission_ids.map(pid => [package_id, pid]);
                await conn.query(
                    "INSERT INTO package_permissions (package_id, permission_id) VALUES ?",
                    [values]
                );
            }
            
            await conn.commit();
            res.json({ success: true, message: "Modular package created successfully!" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("modular_package.create", error, res);
    }
};

// 3. Update existing package
exports.update = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        
        const { id, name, code, industry_code, description, icon, permission_ids } = req.body;
        
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // A. Update Package Info
            await conn.query(
                "UPDATE modular_packages SET name = ?, code = ?, industry_code = ?, description = ?, icon = ? WHERE id = ?",
                [name, code, industry_code || 'coffee_cafe', description, icon, id]
            );
            
            // B. Refresh Permissions
            await conn.query("DELETE FROM package_permissions WHERE package_id = ?", [id]);
            if (Array.isArray(permission_ids) && permission_ids.length > 0) {
                const values = permission_ids.map(pid => [id, pid]);
                await conn.query(
                    "INSERT INTO package_permissions (package_id, permission_id) VALUES ?",
                    [values]
                );
            }
            
            await conn.commit();
            res.json({ success: true, message: "Modular package updated successfully!" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("modular_package.update", error, res);
    }
};

// 4. Get permissions linked to a package
exports.getPermissions = async (req, res) => {
    try {
        const { id } = req.query;
        const [list] = await db.query(`
            SELECT p.* 
            FROM permissions p
            INNER JOIN package_permissions pp ON p.id = pp.permission_id
            WHERE pp.package_id = ?
        `, [id]);
        res.json({ list });
    } catch (error) {
        logError("modular_package.getPermissions", error, res);
    }
};
