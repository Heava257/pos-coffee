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
            active_modules, // Array of strings like ['POS', 'Ordering']
            smtp_user,
            smtp_pass,
            province,
            district
        } = req.body;

        const modulesStr = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || "POS");

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create Business
            const [business] = await conn.query(
                "INSERT INTO businesses (name, province, district, owner_name, email, phone, plan_id, plan_type, package_id, active_modules, smtp_user, smtp_pass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [business_name, province || null, district || null, owner_name, email, phone, plan_id || 1, plan_type || 'basic', package_id || null, modulesStr, smtp_user || null, smtp_pass || null]
            );
            const business_id = business.insertId;

            // 2. Create Main Branch (Use IGNORE to prevent duplicates)
            const [branch] = await conn.query(
                "INSERT IGNORE INTO branches (business_id, name, province, district, is_main) VALUES (?, ?, ?, ?, ?)",
                [business_id, "Main Branch", province || null, district || null, '1']
            );
            
            // Fetch the branch_id (either newly inserted or existing)
            let branch_id = branch.insertId;
            if (branch_id === 0) {
                const [existingBranch] = await conn.query("SELECT id FROM branches WHERE business_id = ? AND is_main = '1' LIMIT 1", [business_id]);
                branch_id = existingBranch[0].id;
            }

            // 3. Setup Default Roles for this business (Use IGNORE)
            
            // 3.1 Owner Role
            const [role_res] = await conn.query(
                "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Owner", "owner"]
            );
            
            let role_id = role_res.insertId;
            if (role_id === 0) {
                const [existingRole] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner' LIMIT 1", [business_id]);
                role_id = existingRole[0].id;
            }
            
            // 🛡️ NEW LOGIC: Grant all actions (CUD), but restrict View (GetList) by Plan
            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
                SELECT ?, id, (min_plan_id <= ?), 1, 1, 1 FROM permissions
                ON DUPLICATE KEY UPDATE 
                can_view = VALUES(can_view), 
                can_create = 1, 
                can_edit = 1, 
                can_delete = 1
            `, [role_id, plan_id || 1]);

            // 3.2 Manager Role
            const [managerRes] = await conn.query(
                "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Manager", "manager"]
            );
            let manager_role_id = managerRes.insertId;
            if (manager_role_id === 0) {
                const [existingRole] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'manager' LIMIT 1", [business_id]);
                manager_role_id = existingRole[0].id;
            }

            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
                SELECT ?, id, (min_plan_id <= ?), 1, 1, 1 FROM permissions 
                WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/stock', '/supplier', '/purchase', '/report_Sale_Summary', '/profile', '/table', '/expense')
                ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = 1, can_edit = 1, can_delete = 1
            `, [manager_role_id, plan_id || 1]);

            // 3.3 Sale Role
            const [saleRes] = await conn.query(
                "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Sale", "sale"]
            );
            let sale_role_id = saleRes.insertId;
            if (sale_role_id === 0) {
                const [existingRole] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'sale' LIMIT 1", [business_id]);
                sale_role_id = existingRole[0].id;
            }

            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
                SELECT ?, id, (min_plan_id <= ?), 1, 1, 1 FROM permissions 
                WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/table', '/profile')
                ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_create = 1, can_edit = 1, can_delete = 1
            `, [sale_role_id, plan_id || 1]);


            // 4. Create Owner Account
            const hashedPassword = bcrypt.hashSync(password, 10);
            const verifyToken = require('crypto').randomBytes(32).toString('hex');
            await conn.query(
                "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin, verify_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [business_id, branch_id, role_id, owner_name, email, hashedPassword, 'active', 1, verifyToken]
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

            // 6. Categories initialization removed: System Admin will manually enable them later via Business Ecosystem
            /*
            if (package_id) {
                await conn.query(`
                    INSERT IGNORE INTO business_categories (business_id, category_id, is_active)
                    SELECT DISTINCT ?, c.id, 1 
                    FROM categories c
                    JOIN modular_packages mp ON c.industry_code = mp.industry_code
                    WHERE mp.id = ? AND c.business_id = 1
                `, [business_id, package_id]);
            } else {
                await conn.query(`
                    INSERT IGNORE INTO business_categories (business_id, category_id, is_active)
                    SELECT DISTINCT ?, id, 1 FROM categories WHERE business_id = 1
                `, [business_id]);
            }
            */

            await conn.commit();
            
            // 🚀 Send Welcome Email to the new owner
            try {
                const { sendWelcomeEmail } = require("../util/email");
                sendWelcomeEmail(email, business_name, owner_name, verifyToken);
            } catch (emailErr) {
                console.error("Welcome Email background fail:", emailErr.message);
            }

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

        // 🛡️ SECURITY: Never allow suspending the primary system business (Super Admin)
        if (id == 1 && status === 'suspended') {
            return res.status(400).json({ message: "Action Forbidden: The Master System Business cannot be suspended." });
        }

        await db.query("UPDATE businesses SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: `Business ${status} successfully` });
    } catch (error) {
        logError("business.updateStatus", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { 
            id, 
            name, 
            business_name, 
            email, // Add this
            province, 
            district, 
            phone, 
            owner_name, 
            plan_id, 
            plan_type,
            package_id, 
            active_modules, 
            smtp_user, 
            smtp_pass, 
            promo_title, 
            promo_subtitle, 
            promo_image, 
            promo_discount, 
            promo_is_active 
        } = req.body;
        
        const finalName = name || business_name;
        const modulesStr = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || "POS");
        const pkgId = (package_id && package_id !== "" && package_id !== "null") ? Number(package_id) : null;

        if (!id) return res.status(400).json({ message: "Business ID is required" });

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // 1. Update business details
            const [updateResult] = await conn.query(
                `UPDATE businesses SET 
                    name = ?, email = ?, province = ?, district = ?, phone = ?, owner_name = ?, 
                    plan_id = ?, plan_type = ?, package_id = ?, active_modules = ?, 
                    smtp_user = ?, smtp_pass = ?, promo_title = ?, promo_subtitle = ?, 
                    promo_image = ?, promo_discount = ?, promo_is_active = ? 
                 WHERE id = ?`,
                [
                    finalName, email || null, province || null, district || null, phone, owner_name, 
                    plan_id || 1, plan_type || 'standard', pkgId, modulesStr, 
                    smtp_user || null, smtp_pass || null, promo_title || null, promo_subtitle || null, 
                    promo_image || null, promo_discount || null, promo_is_active || 0, id
                ]
            );
            
            console.log("UPDATE_SQL_RESULT:", updateResult.info);
            
            // 2. Update owner user name and email (Super Admin of this business)
            await conn.query(
                "UPDATE users SET name = ?, email = ? WHERE business_id = ? AND is_super_admin = 1",
                [owner_name, email, id]
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
                // 🛡️ REFRESH PERMISSIONS: Update can_view based on new plan, keep Action rights (CUD) as 1
                await conn.query(`
                    INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
                    SELECT ?, id, (min_plan_id <= ?), 1, 1, 1 FROM permissions
                    ON DUPLICATE KEY UPDATE 
                    can_view = VALUES(can_view), 
                    can_create = 1, 
                    can_edit = 1, 
                    can_delete = 1
                `, [ownerRoleId, plan_id]);
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
            SELECT name, promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active,
                   global_bogo_active, global_bogo_text, promo_scope, promo_applied_categories, promo_applied_products,
                   promo_tag, promo_tag_color, promo_desc, promo_buy_qty, promo_get_qty, promo_start_date, promo_end_date,
                   discount_scope, discount_applied_categories, discount_applied_products, global_discount
            FROM businesses 
            WHERE id = ?
        `, [business_id]);

        if (list.length === 0) return res.status(404).json({ message: "Business not found" });
        
        // Parse JSON strings back to arrays for the frontend
        const config = {
            ...list[0],
            promo_applied_categories: list[0].promo_applied_categories ? JSON.parse(list[0].promo_applied_categories) : [],
            promo_applied_products: list[0].promo_applied_products ? JSON.parse(list[0].promo_applied_products) : [],
            discount_applied_categories: list[0].discount_applied_categories ? JSON.parse(list[0].discount_applied_categories) : [],
            discount_applied_products: list[0].discount_applied_products ? JSON.parse(list[0].discount_applied_products) : [],
        };
        
        res.json({ config });
    } catch (error) {
        logError("business.getPublicConfig", error, res);
    }
};

exports.getSMTPHealth = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        
        const [businesses] = await db.query("SELECT id, name, smtp_user, smtp_pass FROM businesses");
        
        let healthy = 0;
        let pending = 0;
        let failed = 0;
        const details = [];

        for (const biz of businesses) {
            const hasUser = !!biz.smtp_user;
            const hasPass = !!biz.smtp_pass;
            
            let status = "missing";
            if (hasUser && hasPass) {
                status = "configured";
                healthy++;
            } else if (hasUser || hasPass) {
                status = "incomplete";
                pending++;
            } else {
                failed++;
            }

            details.push({
                id: biz.id,
                name: biz.name,
                status,
                email: biz.smtp_user || "Not set"
            });
        }

        res.json({
            summary: { healthy, pending, failed, total: businesses.length },
            details
        });
    } catch (error) {
        logError("business.getSMTPHealth", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden: Platform management only" });
        
        const { id } = req.body;
        
        if (!id) return res.status(400).json({ message: "Business ID is required" });
        
        // 1. Protection for Master Business
        if (id == 1) {
            return res.status(400).json({ message: "Action Forbidden: The Master System Business cannot be deleted." });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 2. Check if business has sales data
            const [orders] = await conn.query("SELECT id FROM orders WHERE business_id = ? LIMIT 1", [id]);
            if (orders.length > 0) {
                await conn.rollback();
                return res.status(400).json({ message: "Cannot delete: This business already has sales data." });
            }

            // 3. Clean up related records manually to prevent foreign key errors
            await conn.query("DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE business_id = ?)", [id]);
            await conn.query("DELETE FROM roles WHERE business_id = ?", [id]);
            await conn.query("DELETE FROM users WHERE business_id = ?", [id]);
            await conn.query("DELETE FROM branches WHERE business_id = ?", [id]);
            
            // Try deleting products and categories (wrap in try-catch in case of other constraints)
            try {
                await conn.query("DELETE FROM branch_products WHERE product_id IN (SELECT id FROM products WHERE business_id = ?)", [id]);
                await conn.query("DELETE FROM products WHERE business_id = ?", [id]);
                await conn.query("DELETE FROM business_categories WHERE business_id = ?", [id]);
                await conn.query("DELETE FROM categories WHERE business_id = ?", [id]);
            } catch (e) {
                console.log("Minor cleanup issue (products/categories):", e.message);
            }

            await conn.query("DELETE FROM subscriptions WHERE business_id = ?", [id]);
            
            try {
                await conn.query("DELETE FROM loyalty_rewards WHERE business_id = ?", [id]);
                await conn.query("DELETE FROM loyalty_programs WHERE business_id = ?", [id]);
            } catch (e) {}

            // 4. Finally delete the business
            await conn.query("DELETE FROM businesses WHERE id = ?", [id]);

            await conn.commit();
            res.json({ success: true, message: "Business deleted successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.remove", error, res);
    }
};
