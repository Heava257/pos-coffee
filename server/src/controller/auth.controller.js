const { logError, db, removeFile } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../util/config");

// Helper for JWT
const generateAccessToken = (data, remember = false) => {
  return jwt.sign(data, config.token.access_token_key, { expiresIn: remember ? "30d" : "7d" });
};

// 1. Register for Business Owner (SaaS Entry Point)
exports.register = async (req, res) => {
  try {
    const {
      business_name,
      owner_name,
      email,
      password,
      phone,
      plan_type,
      active_modules
    } = req.body;

    // Start Transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // A. Create Business
      const finalPlanType = plan_type || 'basic';
      let planId = 1;
      if (finalPlanType === 'standard') planId = 2;
      if (finalPlanType === 'premium') planId = 3;
      
      const finalModules = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || 'POS');

      const [business] = await conn.query(
        "INSERT INTO businesses (name, owner_name, email, phone, plan_type, plan_id, active_modules) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [business_name, owner_name, email, phone, finalPlanType, planId, finalModules]
      );
      const business_id = business.insertId;

      // Create Subscription
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days
      const formattedEndDate = endDate.toISOString().slice(0, 10);
      await conn.query(
        "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'active')",
        [business_id, planId, finalPlanType, startDate, formattedEndDate]
      );

      // B. Create Main Branch (Safe insert with location and phone)
      const [branch] = await conn.query(
        "INSERT IGNORE INTO branches (business_id, name, is_main, phone, province, district, location) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [business_id, "Main Branch", '1', phone || null, req.body.province || null, req.body.district || null, req.body.address || null]
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
        "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin, verify_token, pin_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
        [business_id, branch_id, owner_role_id, owner_name, email, hashedPassword, 'active', 0, verifyToken, '1234']
      );

      await conn.query(`
        INSERT INTO business_categories (business_id, category_id, is_active)
        SELECT ?, id, 0 FROM categories WHERE business_id = 1
      `, [business_id]);

      // Create Welcome Notification with current timestamp for the new business
      await conn.query(
        "INSERT INTO system_notifications (business_id, title, message, type, is_read) VALUES (?, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0)",
        [business_id]
      );
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

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ message: "Missing Google access token" });

    // 1. Fetch profile from Google
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    const { email } = googleRes.data;

    if (!email) return res.status(400).json({ message: "Could not retrieve email from Google" });

    // 2. Find user in DB
    const sql = `
            SELECT u.*, 
                   r.name as role_name, r.code as role_code,
                   b.name as business_name, b.status as business_status, b.logo as business_logo,
                   b.active_modules, b.plan_type, b.plan_id as plan_id,
                   p.name as plan_name, p.max_branches, p.max_staff, p.max_products, p.active_modules as plan_modules,
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
      return res.status(200).json({
        not_registered: true,
        message: "This Gmail is not registered in our system."
      });
    }

    const user = users[0];

    // 3. Status checks (same as regular login)
    if (user.business_status !== 'active') {
      return res.status(403).json({ message: "Your business account is suspended!" });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
    }

    // 4. Update image if user has no image
    if (!user.image && googleRes.data.picture) {
      await db.query("UPDATE users SET image = ? WHERE id = ?", [googleRes.data.picture, user.id]);
      user.image = googleRes.data.picture;
    }

    const loginData = await generateLoginResponse(user);
    res.json({
      message: "Login successful",
      ...loginData
    });
  } catch (error) {
    logError("auth.googleLogin", error, res);
  }
};

// 2. Login (SaaS Context Injection)
const generateLoginResponse = async (user, remember = false) => {
  // Update last_active timestamp for the business
  await db.query("UPDATE businesses SET last_active = NOW() WHERE id = ?", [user.business_id]);

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

  const bizModules = (user.active_modules || "").split(",").map(m => m.trim()).filter(Boolean);
  const planModules = (user.plan_modules || "").split(",").map(m => m.trim()).filter(Boolean);
  const activeModules = [...new Set([...bizModules, ...planModules])];

  const [rolePerms] = await db.query(`
        SELECT DISTINCT 
            p.route_key, 
            p.name,
            rp.can_view,
            rp.can_create,
            rp.can_edit,
            rp.can_delete
        FROM permissions p
        INNER JOIN businesses b ON b.id = ?
        INNER JOIN roles r ON r.id = ?
        INNER JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = r.id
        LEFT JOIN plan_permissions pp ON p.id = pp.permission_id AND pp.plan_id = b.plan_id
        LEFT JOIN module_permissions mp ON p.id = mp.permission_id
        LEFT JOIN system_modules sm ON mp.module_id = sm.id
        WHERE (
            pp.plan_id IS NOT NULL -- Belongs to active plan
            OR FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', '')) -- Belongs to active module
            OR (
                -- Truly Core: Only for Platform Admins (Business ID 1)
                b.id = 1
                AND NOT EXISTS (SELECT 1 FROM plan_permissions WHERE permission_id = p.id)
                AND NOT EXISTS (SELECT 1 FROM module_permissions WHERE permission_id = p.id)
            )
        )
`, [user.business_id, user.role_id]);

  payload.permissions = rolePerms.map(p => p.route_key);
  const accessToken = generateAccessToken(payload, remember);

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
    const { email, password, remember } = req.body;
    const sql = `
            SELECT u.*, 
                   r.name as role_name, r.code as role_code,
                   b.name as business_name, b.status as business_status, b.logo as business_logo,
                   b.active_modules, b.plan_type, b.plan_id as plan_id,
                   p.name as plan_name, p.max_branches, p.max_staff, p.max_products, p.active_modules as plan_modules,
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

    const isStaff = user.role_code !== 'owner' && user.role_code !== 'super_admin';
    // if (user.is_verified === 0 && !isStaff) {
    //   return res.status(403).json({
    //     message: "Your email is not verified yet!",
    //     unverified: true,
    //     email: user.email
    //   });
    // }

    if (user.business_status !== 'active') {
      return res.status(403).json({ message: "Your business account is suspended!" });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Password incorrect!" });
    }

    const loginData = await generateLoginResponse(user, remember);
    res.json({
      message: "Login successful",
      ...loginData
    });
  } catch (error) {
    logError("auth.login", error, res);
  }
};

exports.loginByPassword = async (req, res) => {
  try {
    const { id, password } = req.body;
    const { business_id } = req;

    if (!id || !password) {
      return res.status(400).json({ message: "ID and Password are required!" });
    }

    const sql = `
      SELECT u.*, 
             r.name as role_name, r.code as role_code,
             b.name as business_name, b.status as business_status, b.logo as business_logo,
             b.active_modules, b.plan_type, b.plan_id as plan_id,
             p.name as plan_name, p.max_branches, p.max_staff, p.max_products, p.active_modules as plan_modules,
             mp.ui_layout as business_layout
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN businesses b ON u.business_id = b.id
      LEFT JOIN subscription_plans p ON b.plan_id = p.id
      LEFT JOIN modular_packages mp ON b.package_id = mp.id
      WHERE u.id = ?
    `;

    const [users] = await db.query(sql, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const user = users[0];

    // Verify Password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Password incorrect!" });
    }

    // Check if user belongs to the same business
    if (business_id && user.business_id !== business_id) {
       return res.status(403).json({ message: "Access denied." });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Account deactivated." });
    }

    const loginData = await generateLoginResponse(user);
    res.json({
      message: "Switch successful",
      ...loginData
    });
  } catch (error) {
    logError("auth.loginByPassword", error, res);
  }
};

/**
 * 4. Verify Manager/Owner credentials for high-level approvals
 * (e.g., closing a shift with a large discrepancy)
 */
exports.verifyManager = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { business_id } = req;

    if (!username || !password) {
      return res.status(400).json({ message: "Credentials required!" });
    }

    const sql = `
      SELECT u.id, u.password, u.status, u.business_id, r.code as role_code
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `;

    const [users] = await db.query(sql, [username]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const user = users[0];

    // Check if the user is a Manager or Owner
    const isAuthorized = ["owner", "admin", "manager"].includes(user.role_code.toLowerCase());
    if (!isAuthorized) {
      return res.status(403).json({ message: "Authorized personnel only!" });
    }

    // Verify Password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Password incorrect!" });
    }

    // Check if user belongs to the same business
    if (business_id && user.business_id !== business_id) {
       return res.status(403).json({ message: "Security breach: Wrong business domain." });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Account is inactive." });
    }

    res.json({
      success: true,
      message: "Manager verification successful",
      verified_by: user.id
    });
  } catch (error) {
    logError("auth.verifyManager", error, res);
  }
};

// 3. User Profile (Synchronized with latest DB state)
exports.getProfile = async (req, res) => {
  try {
    const sql = `
            SELECT u.*, 
                   r.name as role_name, r.code as role_code,
                   b.name as business_name, b.status as business_status, b.logo as business_logo,
                   b.active_modules, b.plan_type, b.plan_id as plan_id,
                   p.name as plan_name, p.max_branches, p.max_staff, p.max_products, p.active_modules as plan_modules,
                   mp.ui_layout as business_layout
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            INNER JOIN businesses b ON u.business_id = b.id
            LEFT JOIN subscription_plans p ON b.plan_id = p.id
            LEFT JOIN modular_packages mp ON b.package_id = mp.id
            WHERE u.id = ?
        `;

    const [users] = await db.query(sql, [req.user_id]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const bizModules = (user.active_modules || "").split(",").map(m => m.trim()).filter(Boolean);
    const planModules = (user.plan_modules || "").split(",").map(m => m.trim()).filter(Boolean);
    const activeModules = [...new Set([...bizModules, ...planModules])];

    const [rolePerms] = await db.query(`
        SELECT DISTINCT 
            p.route_key, 
            p.name,
            rp.can_view,
            rp.can_create,
            rp.can_edit,
            rp.can_delete
        FROM permissions p
        INNER JOIN businesses b ON b.id = ?
        INNER JOIN roles r ON r.id = ?
        INNER JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = r.id
        LEFT JOIN plan_permissions pp ON p.id = pp.permission_id AND pp.plan_id = b.plan_id
        LEFT JOIN module_permissions mp ON p.id = mp.permission_id
        LEFT JOIN system_modules sm ON mp.module_id = sm.id
        WHERE (
            pp.plan_id IS NOT NULL -- Belongs to active plan
            OR FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', '')) -- Belongs to active module
            OR (
                -- Truly Core: Only for Platform Admins (Business ID 1)
                b.id = 1
                AND NOT EXISTS (SELECT 1 FROM plan_permissions WHERE permission_id = p.id)
                AND NOT EXISTS (SELECT 1 FROM module_permissions WHERE permission_id = p.id)
            )
        )
`, [user.business_id, user.role_id]);

    res.json({
      profile: {
        ...user,
        active_modules: activeModules.join(","),
        is_super_admin: user.role_code === 'super_admin' ? 1 : 0
      },
      permission: rolePerms.map(p => p.route_key)
    });
  } catch (error) {
    logError("auth.getProfile", error, res);
  }
};

// 4. Update Profile (User themselves)
exports.updateProfile = async (req, res) => {
  try {
    const { name, password, email, pin_code } = req.body;
    const user_id = req.user_id; // From token
    const image = req.file?.path || req.file?.filename;

    // Check if user is super admin to allow email change
    const [currentUser] = await db.query(`
      SELECT r.code as role_code FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [user_id]);

    const isSuperAdmin = currentUser[0]?.role_code === 'super_admin';

    let sql = "UPDATE users SET name = ?";
    let params = [name];

    if (pin_code) {
      sql += ", pin_code = ?";
      params.push(pin_code);
    }

    if (email && isSuperAdmin) {
      // Check if email already exists for another user
      const [existing] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, user_id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already in use by another account." });
      }
      sql += ", email = ?";
      params.push(email);
    }

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
        sp.name as plan_name, sp.active_modules as plan_modules,
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
      active_modules: [...new Set([...(updatedUser[0].active_modules || "").split(","), ...(updatedUser[0].plan_modules || "").split(","), "POS"])].filter(Boolean).join(","),
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await db.query("SELECT id, name, status FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Email not found in our system!" });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(403).json({ message: "This account is not active. Please contact support." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [otpCode, expiry, user.id]
    );

    const { sendPasswordResetEmail } = require("../util/email");

    // Await email sending to guarantee delivery status
    const emailSent = await sendPasswordResetEmail(email, user.name, otpCode);
    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to deliver OTP email. Please check configuration." });
    }

    res.json({
      success: true,
      message: "6-digit OTP code has been sent to your email! (Please check your spam folder)"
    });
  } catch (error) {
    logError("auth.forgotPassword", error, res);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()",
      [email, otp]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP code!" });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, users[0].id]
    );

    res.json({
      success: true,
      message: "Password has been reset successfully! You can now login with your new password."
    });
  } catch (error) {
    logError("auth.resetPassword", error, res);
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()",
      [email, otp]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP code!" });
    }

    res.json({
      success: true,
      message: "OTP verified successfully!"
    });
  } catch (error) {
    logError("auth.verifyOtp", error, res);
  }
};
