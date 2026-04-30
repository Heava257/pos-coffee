const { logError, db, removeFile } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../util/config");

// Helper for JWT
const generateAccessToken = (data) => {
  return jwt.sign(data, config.token.access_token_key, { expiresIn: "7d" });
};

// 1. Register for Business Owner (SaaS Entry Point)
exports.register = async (req, res) => {
  try {
    const {
      business_name,
      owner_name,
      email,
      password,
      phone
    } = req.body;

    // Start Transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // A. Create Business
      const [business] = await conn.query(
        "INSERT INTO businesses (name, owner_name, email, phone, plan_type, active_modules) VALUES (?, ?, ?, ?, ?, ?)",
        [business_name, owner_name, email, phone, 'basic', 'POS']
      );
      const business_id = business.insertId;

      // B. Create Main Branch (Safe insert)
      const [branch] = await conn.query(
        "INSERT IGNORE INTO branches (business_id, name, is_main) VALUES (?, ?, ?)",
        [business_id, "Main Branch", '1']
      );
      let branch_id = branch.insertId;
      if (branch_id === 0) {
        const [existing] = await conn.query("SELECT id FROM branches WHERE business_id = ? AND is_main = '1' LIMIT 1", [business_id]);
        branch_id = existing[0].id;
      }

      // D. Setup Default Roles for the new business
      
      // 1. Owner Role
      const [ownerRes] = await conn.query(
        "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
        [business_id, "Owner", "owner"]
      );
      let owner_role_id = ownerRes.insertId;
      if (owner_role_id === 0) {
        const [existing] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner' LIMIT 1", [business_id]);
        owner_role_id = existing[0].id;
      }
      await conn.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions", [owner_role_id]);

      // 2. Manager Role
      const [managerRes] = await conn.query(
        "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
        [business_id, "Manager", "manager"]
      );
      let manager_role_id = managerRes.insertId;
      if (manager_role_id === 0) {
        const [existing] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'manager' LIMIT 1", [business_id]);
        manager_role_id = existing[0].id;
      }
      await conn.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT ?, id FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/stock', '/supplier', '/purchase', '/report_Sale_Summary', '/profile', '/table', '/expense')
      `, [manager_role_id]);

      // 3. Sale Role
      const [saleRes] = await conn.query(
        "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
        [business_id, "Sale", "sale"]
      );
      let sale_role_id = saleRes.insertId;
      if (sale_role_id === 0) {
        const [existing] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'sale' LIMIT 1", [business_id]);
        sale_role_id = existing[0].id;
      }
      await conn.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT ?, id FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/table', '/profile')
      `, [sale_role_id]);

      // C. Create Owner Account (Linked to Owner Role)
      const hashedPassword = bcrypt.hashSync(password, 10);
      const verifyToken = require('crypto').randomBytes(32).toString('hex');
      await conn.query(
        "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin, verify_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [business_id, branch_id, owner_role_id, owner_name, email, hashedPassword, 'active', 0, verifyToken]
      );

      // E. Enable all global categories by default for new businesses
      await conn.query(`
        INSERT INTO business_categories (business_id, category_id, is_active)
        SELECT ?, id, 1 FROM categories WHERE business_id = 1
      `, [business_id]);

      await conn.commit();
      
      // 🚀 Send Welcome Email
      try {
          const { sendWelcomeEmail } = require("../util/email");
          sendWelcomeEmail(email, business_name, owner_name, verifyToken);
      } catch (emailErr) {
          console.error("Welcome Email background fail:", emailErr.message);
      }

      res.json({ success: true, message: "Business Registered Successfully! Please check your email to verify your account." });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    logError("auth.register", error, res);
  }
};

// 2. Login (SaaS Context Injection)
const generateLoginResponse = async (user) => {
    const payload = {
        user_id: user.id,
        business_id: user.business_id,
        branch_id: user.branch_id,
        role_id: user.role_id,
        name: user.name,
        email: user.email,
        plan_name: user.plan_name,
        plan_limits: {
            branches: user.max_branches,
            staff: user.max_staff,
            products: user.max_products
        },
        business_name: user.business_name,
        role_name: user.role_name,
        role_code: user.role_code,
        business_logo: user.business_logo,
        profile_image: user.image,
        active_modules: user.active_modules,
        plan_type: user.plan_type,
        plan_id: user.plan_id,
        business_layout: user.business_layout
    };

    const activeModules = (user.active_modules || "POS").split(",").map(m => m.trim());
    
    const [rolePerms] = await db.query(`
        SELECT DISTINCT p.route_key, p.name 
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        LEFT JOIN module_permissions mp ON p.id = mp.permission_id
        LEFT JOIN system_modules sm ON mp.module_id = sm.id
        WHERE rp.role_id = ?
        ${user.business_id === 1 ? '' : 'AND p.min_plan_id <= (SELECT plan_id FROM businesses WHERE id = ?)'}
        AND (
            ? = 1 -- 👑 Super Admin Bypass
            OR mp.module_id IS NULL -- Core Permission
            OR sm.code IN (?) -- Belongs to active module
        )
    `, user.business_id === 1 
        ? [user.role_id, user.business_id, activeModules] 
        : [user.role_id, user.business_id, user.business_id, activeModules]
    );

    payload.permissions = rolePerms.map(p => p.route_key.replace('/', '')); 
    const accessToken = generateAccessToken(payload);

    if (user.branch_id) {
        const [branch] = await db.query("SELECT name FROM branches WHERE id = ?", [user.branch_id]);
        if (branch.length > 0) payload.branch_name = branch[0].name;
    }

    return {
        access_token: accessToken,
        profile: {
            ...payload,
            is_super_admin: user.role_code === 'super_admin' ? 1 : 0
        },
        permission: rolePerms
    };
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const sql = `
            SELECT u.*, 
                   r.name as role_name, r.code as role_code,
                   b.name as business_name, b.status as business_status, b.logo as business_logo,
                   b.active_modules, b.plan_type, b.plan_id as plan_id,
                   p.name as plan_name, p.max_branches, p.max_staff, p.max_products,
                   mp.ui_layout as business_layout
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            INNER JOIN businesses b ON u.business_id = b.id
            LEFT JOIN subscription_plans p ON b.plan_id = p.id
            LEFT JOIN modular_packages mp ON b.package_id = mp.id
            WHERE u.email = ?
        `;

        const [users] = await db.query(sql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Account not found or incorrect email!" });
        }

        const user = users[0];
        
        if (user.is_verified === 0) {
            return res.status(403).json({ 
                message: "Your email is not verified yet!", 
                unverified: true,
                email: user.email 
            });
        }

        if (user.business_status !== 'active') {
            return res.status(403).json({ message: "Your business account is suspended!" });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: "Password incorrect!" });
        }

        const loginData = await generateLoginResponse(user);
        res.json({
            message: "Login successful",
            ...loginData
        });
    } catch (error) {
        logError("auth.login", error, res);
    }
};

// 3. User Profile (Synchronized with latest DB state)
exports.getProfile = async (req, res) => {
  try {
    const [fullUser] = await db.query(`
      SELECT u.*, r.name as role_name, r.code as role_code, 
             b.name as business_name, b.active_modules, b.plan_type, b.plan_id,
             sp.name as plan_name,
             br.name as branch_name, mp.ui_layout as business_layout
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN businesses b ON u.business_id = b.id
      LEFT JOIN subscription_plans sp ON b.plan_id = sp.id
      LEFT JOIN branches br ON u.branch_id = br.id
      LEFT JOIN modular_packages mp ON b.package_id = mp.id
      WHERE u.id = ?
    `, [req.user_id]);

    if (fullUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [rolePerms] = await db.query(`
       SELECT p.route_key, p.name FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?
    `, [fullUser[0].role_id]);

    res.json({
      profile: {
        ...fullUser[0],
        is_super_admin: fullUser[0].role_code === 'super_admin' ? 1 : 0
      },
      permission: rolePerms
    });
  } catch (error) {
    logError("auth.getProfile", error, res);
  }
};

// 4. Update Profile (User themselves)
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user_id = req.user_id; // From token
    const image = req.file?.path || req.file?.filename;

    let sql = "UPDATE users SET name = ?";
    let params = [name];

    if (image) {
      sql += ", image = ?";
      params.push(image);
    }

    if (password && password.trim() !== "") {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    params.push(user_id);

    // Update current profile in DB
    await db.query(sql, params);

    // Fetch refreshed user data with business and role context
    // We map 'u.image' to 'profile_image' for frontend consistency
    const [updatedUser] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.image as profile_image, u.branch_id, u.business_id, u.role_id,
        b.name as business_name, b.logo as business_logo, b.active_modules, b.plan_type, b.plan_id,
        sp.name as plan_name,
        r.name as role_name, r.code as role_code, br.name as branch_name,
        mp.ui_layout as business_layout
      FROM users u
      JOIN businesses b ON u.business_id = b.id
      LEFT JOIN subscription_plans sp ON b.plan_id = sp.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches br ON u.branch_id = br.id
      LEFT JOIN modular_packages mp ON b.package_id = mp.id
      WHERE u.id = ?
    `, [user_id]);

    const newProfile = {
      ...updatedUser[0],
      is_super_admin: updatedUser[0].role_code === 'super_admin' ? 1 : 0
    };

    res.json({
      success: true,
      message: "Profile updated successfully!",
      profile: newProfile
    });
  } catch (error) {
    logError("auth.updateProfile", error, res);
  }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.body;
        if (!token || !email) {
            return res.status(400).json({ message: "Missing token or email" });
        }

        const [users] = await db.query(
            "SELECT id FROM users WHERE email = ? AND verify_token = ?",
            [email, token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired verification link!" });
        }

        await db.query(
            "UPDATE users SET is_verified = 1, verify_token = NULL WHERE id = ?",
            [users[0].id]
        );

        res.json({ 
            success: true, 
            message: "Email verified successfully! You can now login to your account."
        });
    } catch (error) {
        logError("auth.verifyEmail", error, res);
    }
};
