const { db, logError } = require("../util/helper");
const bcrypt = require("bcrypt");

exports.getList = async (req, res) => {
    try {
        // Only System Admins (Business ID 1) can view all businesses
        if (req.business_id !== 1) {
            return res.status(403).json({ message: "Forbidden: Platform management only" });
        }

        const sql = `
            SELECT b.*, p.name as plan_name,
                   (SELECT COUNT(*) FROM users WHERE business_id = b.id) as total_users,
                   (SELECT COUNT(*) FROM branches WHERE business_id = b.id) as total_branches,
                   (SELECT end_date FROM subscriptions WHERE business_id = b.id AND status = 'active' ORDER BY end_date DESC LIMIT 1) as expiry_date
            FROM businesses b
            JOIN subscription_plans p ON b.plan_id = p.id
            ORDER BY b.id DESC
        `;
        const [list] = await db.query(sql);
        res.json({ list });
    } catch (error) {
        logError("business.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        if (req.business_id !== 1) {
            return res.status(403).json({ message: "Forbidden: Only system admins can create businesses" });
        }

        const {
            business_name,
            owner_name,
            email,
            password,
            phone,
            plan_id,
            plan_type,
            package_id,
            active_modules // Array of strings like ['POS', 'Ordering']
        } = req.body;

        const modulesStr = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || "POS");

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create Business
            const [business] = await conn.query(
                "INSERT INTO businesses (name, owner_name, email, phone, plan_id, plan_type, package_id, active_modules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [business_name, owner_name, email, phone, plan_id || 1, plan_type || 'basic', package_id || null, modulesStr]
            );
            const business_id = business.insertId;

            // 2. Create Main Branch
            const [branch] = await conn.query(
                "INSERT INTO branches (business_id, name, is_main) VALUES (?, ?, ?)",
                [business_id, "Main Branch", '1']
            );
            const branch_id = branch.insertId;

            // 3. Setup Default Roles for this business
            
            // 3.1 Owner Role (Full Access)
            const [role_res] = await conn.query(
                "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Owner", "owner"]
            );
            const role_id = role_res.insertId;

            // Link permissions: Use Modular Package if selected, otherwise use plan-based defaults
            if (package_id) {
                await conn.query(`
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT ?, permission_id FROM package_permissions WHERE package_id = ?
                `, [role_id, package_id]);
            } else {
                await conn.query(`
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT ?, id FROM permissions WHERE min_plan_id <= ?
                `, [role_id, plan_id || 1]);
            }

            // 3.2 Manager Role (Operations + Reports)
            const [managerRes] = await conn.query(
                "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Manager", "manager"]
            );
            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT ?, id FROM permissions 
                WHERE min_plan_id <= ? AND route_key IN ('/invoices', '/order', '/category', '/product', '/stock', '/supplier', '/purchase', '/report_Sale_Summary', '/profile', '/table', '/expense')
            `, [managerRes.insertId, plan_id || 1]);

            // 3.3 Sale Role (POS Operations)
            const [saleRes] = await conn.query(
                "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Sale", "sale"]
            );
            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT ?, id FROM permissions 
                WHERE min_plan_id <= ? AND route_key IN ('/invoices', '/order', '/category', '/product', '/table', '/profile')
            `, [saleRes.insertId, plan_id || 1]);


            // 4. Create Owner Account
            const hashedPassword = bcrypt.hashSync(password, 10);
            await conn.query(
                "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [business_id, branch_id, role_id, owner_name, email, hashedPassword, 'active', 1]
            );

            // 5. Create Initial Subscription Record (30 days for new ones, or based on plan)
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Default 30 days
            const formattedEndDate = endDate.toISOString().split('T')[0];

            await conn.query(
                "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                [business_id, plan_id || 1, plan_type || 'basic', startDate, formattedEndDate, 'active']
            );

            // 6. Enable global categories based on industry package (blueprint)
            if (package_id) {
                await conn.query(`
                    INSERT INTO business_categories (business_id, category_id, is_active)
                    SELECT ?, c.id, 1 
                    FROM categories c
                    JOIN modular_packages mp ON c.industry_code = mp.industry_code
                    WHERE mp.id = ? AND c.business_id = 1
                `, [business_id, package_id]);
            } else {
                // Fallback: Enable all global categories if no specific package is selected
                await conn.query(`
                    INSERT INTO business_categories (business_id, category_id, is_active)
                    SELECT ?, id, 1 FROM categories WHERE business_id = 1
                `, [business_id]);
            }

            await conn.commit();
            res.json({ success: true, message: "Business and Owner created with 30-day active period!" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.create", error, res);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });

        const { id, status } = req.body;
        await db.query("UPDATE businesses SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: `Business ${status} successfully` });
    } catch (error) {
        logError("business.updateStatus", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id, name, phone, owner_name, package_id, active_modules, promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active } = req.body;
        
        // Detailed logging to identify why package_id is null
        console.log("DEBUG_UPDATE_BIZ:", { id, name, package_id, active_modules_raw: active_modules });

        if (!id) return res.status(400).json({ message: "Business ID is required" });

        const modulesStr = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || "POS");
        
        // Ensure package_id is a valid number or null
        const pkgId = (package_id && package_id !== "" && package_id !== "null") ? Number(package_id) : null;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // 1. Update business details
            const [updateResult] = await conn.query(
                "UPDATE businesses SET name = ?, phone = ?, owner_name = ?, package_id = ?, active_modules = ?, promo_title = ?, promo_subtitle = ?, promo_image = ?, promo_discount = ?, promo_is_active = ? WHERE id = ?",
                [name, phone, owner_name, pkgId, modulesStr, promo_title || null, promo_subtitle || null, promo_image || null, promo_discount || null, promo_is_active || 0, id]
            );
            
            console.log("UPDATE_SQL_RESULT:", updateResult.info);
            
            // 2. Update owner user name (Super Admin of this business)
            await conn.query(
                "UPDATE users SET name = ? WHERE business_id = ? AND is_super_admin = 1",
                [owner_name, id]
            );

            // 3. Sync permissions for the owner role if the package changed
            if (package_id) {
                const [ownerRoles] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner'", [id]);
                if (ownerRoles.length > 0) {
                    const ownerRoleId = ownerRoles[0].id;
                    // Add only new permissions from the blueprint without deleting existing ones
                    await conn.query(`
                        INSERT IGNORE INTO role_permissions (role_id, permission_id)
                        SELECT ?, permission_id FROM package_permissions WHERE package_id = ?
                    `, [ownerRoleId, package_id]);
                }
            }
            
            await conn.commit();
            res.json({ success: true, message: "Business updated successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.update", error, res);
    }
};

exports.updatePlan = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { business_id, plan_id, plan_type, package_id, active_modules, duration_days } = req.body;
        const modulesStr = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || "POS");

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Update business table
            await conn.query(
                "UPDATE businesses SET plan_id = ?, plan_type = ?, package_id = ?, active_modules = ? WHERE id = ?", 
                [plan_id, plan_type || 'standard', package_id || null, modulesStr, business_id]
            );

            // 2. Set existing active subscriptions to expired
            await conn.query("UPDATE subscriptions SET status = 'expired' WHERE business_id = ? AND status = 'active'", [business_id]);

            // 3. Create new subscription period
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (duration_days || 30));
            const formattedEndDate = endDate.toISOString().split('T')[0];

            await conn.query(
                "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                [business_id, plan_id, plan_type || 'standard', startDate, formattedEndDate, 'active']
            );

            // 4. Auto-update Owner role permissions
            const [ownerRoles] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner'", [business_id]);
            if (ownerRoles.length > 0) {
                const ownerRoleId = ownerRoles[0].id;
                // Add only new permissions without deleting existing overrides
                if (package_id) {
                    await conn.query(`
                        INSERT IGNORE INTO role_permissions (role_id, permission_id)
                        SELECT ?, permission_id FROM package_permissions WHERE package_id = ?
                    `, [ownerRoleId, package_id]);
                } else {
                    await conn.query(`
                        INSERT IGNORE INTO role_permissions (role_id, permission_id)
                        SELECT ?, id FROM permissions WHERE min_plan_id <= ?
                    `, [ownerRoleId, plan_id]);
                }
            }

            await conn.commit();
            res.json({ message: "Business subscription plan updated successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.updatePlan", error, res);
    }
};

exports.getInsights = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id } = req.query;

        // 1. Order Volume Trend (Count only, no money)
        const [orderTrend] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as label, COUNT(*) as value 
            FROM orders 
            WHERE business_id = ? AND status != 'cancelled'
            GROUP BY label 
            ORDER BY label DESC 
            LIMIT 6
        `, [id]);

        // 2. Product Popularity
        const [topProducts] = await db.query(`
            SELECT p.name, SUM(od.qty) as total_sold
            FROM order_details od
            JOIN products p ON od.product_id = p.id
            JOIN orders o ON od.order_id = o.id
            WHERE o.business_id = ? AND o.status != 'cancelled'
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        `, [id]);

        // 3. Category Distribution
        const [categories] = await db.query(`
            SELECT c.name, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND business_id = ?) as product_count
            FROM categories c
            WHERE business_id = ?
        `, [id, id]);

        // 4. Last Activity
        const [lastActivity] = await db.query(`
            SELECT created_at FROM orders WHERE business_id = ? ORDER BY id DESC LIMIT 1
        `, [id]);

        res.json({ 
            orderTrend: orderTrend.reverse(), 
            topProducts, 
            categories, 
            lastActive: lastActivity[0]?.created_at || null 
        });
    } catch (error) {
        logError("business.getInsights", error, res);
    }
}

exports.getPublicConfig = async (req, res) => {
    try {
        const { business_id } = req.query;
        if (!business_id) return res.status(400).json({ message: "Business ID is required" });

        const [list] = await db.query(`
            SELECT name, promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active 
            FROM businesses 
            WHERE id = ?
        `, [business_id]);

        if (list.length === 0) return res.status(404).json({ message: "Business not found" });
        res.json({ config: list[0] });
    } catch (error) {
        logError("business.getPublicConfig", error, res);
    }
};
