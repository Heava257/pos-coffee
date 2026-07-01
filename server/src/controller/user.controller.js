const { db, logError } = require("../util/helper");
const bcrypt = require("bcrypt");

exports.getList = async (req, res) => {
    try {
        const { business_id } = req;
        const { target_business_id, branch_id, tenant_only } = req.query;
        
        let bizId = business_id;
        let isGlobalView = false;
        let isTenantOnlyView = false;

        if (business_id === 1) {
            if (target_business_id) {
                bizId = target_business_id;
            } else if (tenant_only === "true") {
                isTenantOnlyView = true;
                bizId = null;
            } else {
                isGlobalView = true;
            }
        }

        // 1. Fetch User List
        let sqlUsers = `
            SELECT u.id, u.name, u.email as username, u.tel, u.address, u.image as profile_image,
                   u.status, u.is_super_admin, r.name as role_name, b.name as branch_name,
                   u.role_id, u.branch_id, u.created_at as create_at, u.business_id,
                   biz.name as business_name, u.pin_code
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
            LEFT JOIN businesses biz ON u.business_id = biz.id
        `;
        let params = [];

        if (isGlobalView) {
            // Platform Admin Global View: Show only Platform Team (Business 1) 
            // and Platform-wide Super Admins.
            // We exclude tenant owners (is_super_admin=1 but business_id > 1) 
            // because they are managed in the Business Ecosystem page.
            sqlUsers += " WHERE u.business_id = 1";
        } else if (isTenantOnlyView) {
            // Tenant Only View: Show only staff from registered businesses (Business > 1)
            sqlUsers += " WHERE u.business_id > 1";
        } else {
            sqlUsers += " WHERE u.business_id = ?";
            params.push(bizId);
        }

        if (branch_id) {
            sqlUsers += " AND u.branch_id = ?";
            params.push(branch_id);
        }

        sqlUsers += " ORDER BY u.is_super_admin DESC, u.id ASC";
        const [list] = await db.query(sqlUsers, params);

        // 2. Fetch Meta Data
        let roles = [];
        let branches = [];
        if (bizId) {
            [roles] = await db.query("SELECT id as value, name as label FROM roles WHERE business_id = ?", [bizId]);
            [branches] = await db.query("SELECT id as value, name as label FROM branches WHERE business_id = ?", [bizId]);
        }
        
        let businesses = [];
        if (business_id === 1) {
            [businesses] = await db.query("SELECT id, name FROM businesses WHERE status = 'active' ORDER BY id ASC");
        }

        // 3. Stats based on current list
        const totalStaff = list.length;
        const superAdmins = list.filter(u => u.is_super_admin === 1).length;
        const activeUsers = list.filter(u => u.status === 'active').length;

        res.json({
            list,
            role: roles,
            branches: branches,
            businesses: businesses,
            summary: {
                total_staff: totalStaff,
                super_admins: superAdmins,
                active_users: activeUsers,
                total_branches: branches.length
            }
        });
    } catch (error) {
        logError("user.getList", error, res);
    }
};

exports.register = async (req, res) => {
    try {
        const { business_id: session_biz_id } = req;
        const {
            id, name, username, password, pin_code, role_id, branch_id, is_super_admin, address, tel, is_active, business_id
        } = req.body;

        // Platform Admin can specify target business_id
        const bizId = (session_biz_id === 1 && business_id) ? business_id : session_biz_id;

        const image = req.file?.path || req.file?.filename || null;
        const statusVal = (is_active === 1 || is_active === '1' || is_active === true) ? 'active' : 'inactive';

        if (id) {
            // 🛡️ SECURITY: Prevent deactivating the master super admin (ID 1)
            if (id == 1 && statusVal !== 'active') {
                return res.status(403).json({ message: "Action Forbidden: The Master Super Admin account cannot be deactivated." });
            }

            const isPlatformAdmin = session_biz_id === 1;

            // Update existing staff
            let sql = "UPDATE users SET name=?, role_id=?, branch_id=?, is_super_admin=?, address=?, tel=?, status=?, pin_code=?";
            let params = [name, role_id, branch_id, is_super_admin || 0, address, tel, statusVal, pin_code];

            if (username && (isPlatformAdmin || req.auth?.role_code === 'owner')) {
                const [existing] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [username, id]);
                if (existing.length > 0) {
                    return res.status(400).json({ message: "Email already in use by another account." });
                }
                sql += ", email=?";
                params.push(username);
            }

            if (image) {
                sql += ", image=?";
                params.push(image);
            }

            if (password && password !== "") {
                sql += ", password=?";
                const hashedPassword = await bcrypt.hash(password, 12);
                params.push(hashedPassword);
            }

            sql += " WHERE id=? AND business_id=?";
            params.push(id, bizId);

            await db.query(sql, params);
            return res.json({ message: "User updated successfully" });
        } else {
            // Create new staff — check plan limits
            const { checkPlanLimit } = require("../util/helper");
            const limitCheck = await checkPlanLimit(bizId, 'staff');
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    message: limitCheck.message,
                    limit_reached: true
                });
            }

            if (!password) {
                return res.status(400).json({ message: "Password is required for new users." });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const defaultPin = pin_code || '1234';
            await db.query(`
                INSERT INTO users (business_id, branch_id, name, email, password, pin_code, role_id, is_super_admin, address, tel, status, image, is_verified) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [bizId, branch_id, name, username, hashedPassword, defaultPin, role_id, is_super_admin || 0, address, tel, statusVal, image]);

            return res.json({ message: "User created successfully!" });
        }
    } catch (error) {
        logError("user.register", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;

        // 🛡️ SECURITY: Prevent deleting the master super admin (ID 1)
        if (id == 1) {
            return res.status(403).json({ message: "Action Forbidden: The Master Super Admin account cannot be deleted." });
        }

        // Prevent self-deletion if needed, but for now just restrict by business_id
        const [data] = await db.query("DELETE FROM users WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "User deleted successfully", data });
    } catch (error) {
        logError("user.remove", error, res);
    }
};

exports.getStaffSwitchList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        
        // Get all active staff in the same business (and optionally same branch)
        // We only return safe info: id, name, image, role_name
        let sql = `
            SELECT u.id, u.name, u.image as profile_image, r.name as role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.business_id = ? AND u.status = 'active'
        `;
        let params = [business_id];

        // If you want to restrict to same branch only, uncomment this:
        // if (branch_id) { sql += " AND u.branch_id = ?"; params.push(branch_id); }

        sql += " ORDER BY u.name ASC";
        
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("user.getStaffSwitchList", error, res);
    }
};
