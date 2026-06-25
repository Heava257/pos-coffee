const authRepository = require("./auth.repository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../../config");
const db = require("../../config/database");
const crypto = require("crypto");
const mailConfig = require("../../config/mail");

const generateAccessToken = (data) => {
  return jwt.sign(data, config.token.access_token_key, { expiresIn: "7d" });
};

const sendBrevoAPI = async ({ to, subject, htmlContent, senderName }) => {
  try {
    const BREVO_API_KEY = mailConfig.brevoApiKey;
    const PLATFORM_SENDER_EMAIL = mailConfig.platformSenderEmail;

    if (!BREVO_API_KEY) {
      console.error("[EMAIL ERROR] BREVO_API_KEY is missing!");
      return false;
    }

    const data = {
      sender: { email: PLATFORM_SENDER_EMAIL, name: senderName || "Coffee POS Platform" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    };

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      }
    });
    return true;
  } catch (error) {
    console.error("[BREVO API ERROR]:", error.response ? error.response.data : error.message);
    return false;
  }
};

const sendWelcomeEmail = async (to, businessName, ownerName, verifyToken) => {
  const subject = `Welcome to Coffee POS Platform - Please Verify Your Email`;
  const verifyLink = `${mailConfig.clientUrl}/verify-email?token=${verifyToken}&email=${to}`;
  
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #1e4a2d;">Welcome to Coffee POS Platform!</h2>
        <p>Hello <strong>${ownerName}</strong>,</p>
        <p>Congratulations! Your business <strong>${businessName}</strong> has been successfully registered.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #a4c9a8; color: #1e4a2d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email & Activate Account</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Sent by Coffee POS Platform Admin</p>
    </div>
  `;

  return sendBrevoAPI({ to, subject, htmlContent });
};

const sendPasswordResetEmail = async (to, name, otpCode) => {
  const subject = `Password Reset OTP - Coffee POS Platform`;
  
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; text-align: center;">
        <h2 style="color: #1e4a2d;">Reset Your Password</h2>
        <p style="text-align: left;">Hello <strong>${name}</strong>,</p>
        <p style="text-align: left;">We received a request to reset your password for your Coffee POS Platform account.</p>
        <p style="text-align: left;">Please use the 6-digit OTP code below to proceed with the password reset. <strong>This code will expire in 1 hour.</strong></p>
        
        <div style="background: #f8fcf9; border: 2px dashed #1e4a2d; border-radius: 12px; padding: 24px; margin: 30px 0; display: inline-block; min-width: 200px;">
            <span style="font-size: 36px; font-weight: 800; color: #1e4a2d; letter-spacing: 12px;">${otpCode}</span>
        </div>

        <p style="text-align: left;">If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Sent by Coffee POS Platform Admin</p>
    </div>
  `;

  return sendBrevoAPI({ to, subject, htmlContent, senderName: "Coffee POS Support" });
};

class AuthService {
  async generateLoginResponse(user) {
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
          pp.plan_id IS NOT NULL
          OR FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', ''))
          OR (
              -- Truly Core: Only for Platform Admins (Business ID 1)
              b.id = 1
              AND NOT EXISTS (SELECT 1 FROM plan_permissions WHERE permission_id = p.id)
              AND NOT EXISTS (SELECT 1 FROM module_permissions WHERE permission_id = p.id)
          )
      )
    `, [user.business_id, user.role_id]);

    payload.permissions = rolePerms.map(p => p.route_key);
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
  }

  async register(body) {
    const {
      business_name,
      owner_name,
      email,
      password,
      phone,
      plan_type,
      active_modules,
      package_id,
      shop_size,
      business_nature,
      province,
      district
    } = body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let planId = body.plan_id ? parseInt(body.plan_id) : 1;
      let finalPlanType = plan_type || 'basic';
      if (body.plan_id) {
        if (planId === 2) finalPlanType = 'standard';
        else if (planId === 3) finalPlanType = 'premium';
        else if (planId === 1) finalPlanType = 'basic';
      } else {
        if (finalPlanType === 'standard') planId = 2;
        else if (finalPlanType === 'premium') planId = 3;
      }
      
      const finalModules = Array.isArray(active_modules) ? active_modules.join(",") : (active_modules || 'POS');

      const [business] = await conn.query(
        "INSERT INTO businesses (name, owner_name, email, phone, plan_type, plan_id, active_modules, package_id, shop_size, business_nature, province, district) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [business_name, owner_name, email, phone, finalPlanType, planId, finalModules, package_id || null, shop_size || null, business_nature || null, province || null, district || null]
      );
      const business_id = business.insertId;

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const formattedEndDate = endDate.toISOString().slice(0, 10);
      await conn.query(
        "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'active')",
        [business_id, planId, finalPlanType, startDate, formattedEndDate]
      );

      const [branch] = await conn.query(
        "INSERT IGNORE INTO branches (business_id, name, is_main) VALUES (?, ?, ?)",
        [business_id, "Main Branch", '1']
      );
      let branch_id = branch.insertId;
      if (branch_id === 0) {
        const [existing] = await conn.query("SELECT id FROM branches WHERE business_id = ? AND is_main = '1' LIMIT 1", [business_id]);
        branch_id = existing[0].id;
      }

      const [ownerRes] = await conn.query(
        "INSERT IGNORE INTO roles (business_id, name, code) VALUES (?, ?, ?)",
        [business_id, "Owner", "owner"]
      );
      let owner_role_id = ownerRes.insertId;
      if (owner_role_id === 0) {
        const [existing] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner' LIMIT 1", [business_id]);
        owner_role_id = existing[0].id;
      }
      await conn.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) 
        SELECT ?, id, 1, 1, 1, 1 FROM permissions
      `, [owner_role_id]);

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
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
        SELECT ?, id, 1, 1, 1, 1 FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/stock', '/supplier', '/purchase', '/report_Sale_Summary', '/profile', '/table', '/expense')
      `, [manager_role_id]);

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
        INSERT IGNORE INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
        SELECT ?, id, 1, 1, 1, 0 FROM permissions 
        WHERE route_key IN ('/invoices', '/order', '/category', '/product', '/table', '/profile')
      `, [sale_role_id]);

      const hashedPassword = bcrypt.hashSync(password, 10);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      await conn.query(
        "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin, verify_token, pin_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
        [business_id, branch_id, owner_role_id, owner_name, email, hashedPassword, 'active', 0, verifyToken, '1234']
      );

      // Resolve package industry mapping to activate only relevant categories
      let targetIndustry = "coffee_cafe"; // Default fallback
      if (package_id) {
        const [pkgRows] = await conn.query("SELECT code, industry_code FROM modular_packages WHERE id = ?", [package_id]);
        if (pkgRows.length > 0) {
          const pkg = pkgRows[0];
          const code = pkg.code;
          if (code === "mart" || pkg.industry_code === "retail") {
            targetIndustry = "mart";
          } else {
            targetIndustry = pkg.industry_code || code || "coffee_cafe";
          }
        }
      }

      await conn.query(`
        INSERT INTO business_categories (business_id, category_id, is_active)
        SELECT ?, id, IF(industry_code = ?, 1, 0) FROM categories WHERE business_id = 1
      `, [business_id, targetIndustry]);

      await conn.commit();

      sendWelcomeEmail(email, business_name, owner_name, verifyToken).catch(err => {
        console.error("Welcome Email background fail:", err.message);
      });

      return { success: true, message: "Business Registered Successfully!" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async googleLogin(accessToken) {
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const { email, picture } = googleRes.data;

    if (!email) throw new Error("Could not retrieve email from Google");

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return { not_registered: true, message: "This Gmail is not registered in our system." };
    }

    if (user.business_status !== 'active') {
      throw new Error("Your business account is suspended!");
    }

    if (user.status !== 'active') {
      throw new Error("Your account has been deactivated. Please contact your administrator.");
    }

    if (!user.image && picture) {
      await authRepository.updateUserImage(user.id, picture);
      user.image = picture;
    }

    const loginData = await this.generateLoginResponse(user);
    return { success: true, ...loginData };
  }

  async login(email, password) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Account not found or incorrect email!");
    }

    const isStaff = user.role_code !== 'owner' && user.role_code !== 'super_admin';
    if (user.is_verified === 0 && !isStaff) {
      return { unverified: true, email: user.email };
    }

    if (user.business_status !== 'active') {
      throw new Error("Your business account is suspended!");
    }

    if (user.status !== 'active') {
      throw new Error("Your account has been deactivated. Please contact your administrator.");
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error("Password incorrect!");
    }

    const loginData = await this.generateLoginResponse(user);
    return { success: true, ...loginData };
  }

  async loginByPassword(id, password, business_id) {
    const user = await authRepository.findUserById(id);
    if (!user) throw new Error("User not found!");

    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error("Password incorrect!");
    }

    if (business_id && user.business_id !== business_id) {
      throw new Error("Access denied.");
    }

    if (user.status !== 'active') {
      throw new Error("Account deactivated.");
    }

    const loginData = await this.generateLoginResponse(user);
    return { success: true, ...loginData };
  }

  async verifyManager(username, password, business_id) {
    const sql = `
      SELECT u.id, u.password, u.status, u.business_id, r.code as role_code
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? OR u.email = ?
    `;
    const [users] = await db.query(sql, [username, username]);
    if (users.length === 0) throw new Error("User not found!");

    const user = users[0];
    const isAuthorized = ["owner", "admin", "manager"].includes(user.role_code.toLowerCase());
    if (!isAuthorized) throw new Error("Authorized personnel only!");

    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error("Password incorrect!");
    }

    if (business_id && user.business_id !== business_id) {
      throw new Error("Security breach: Wrong business domain.");
    }

    if (user.status !== 'active') {
      throw new Error("Account is inactive.");
    }

    return { verified_by: user.id };
  }

  async verifyEmail(token, email) {
    const user = await authRepository.findUserByVerifyToken(email, token);
    if (!user) throw new Error("Invalid or expired verification link!");

    await authRepository.markEmailAsVerified(user.id);
    return true;
  }

  async forgotPassword(email) {
    const [users] = await db.query("SELECT id, name, status FROM users WHERE email = ?", [email]);
    if (users.length === 0) throw new Error("Email not found in our system!");

    const user = users[0];
    if (user.status !== 'active') throw new Error("This account is not active. Please contact support.");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600000);

    await authRepository.updateResetToken(user.id, otpCode, expiry);

    sendPasswordResetEmail(email, user.name, otpCode).catch(err => {
      console.error("[BACKGROUND EMAIL ERROR] Forgot Password:", err.message);
    });

    return true;
  }

  async resetPassword(email, otp, new_password) {
    const user = await authRepository.verifyEmailOtp(email, otp);
    if (!user) throw new Error("Invalid or expired OTP code!");

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await authRepository.updatePasswordAndClearReset(user.id, hashedPassword);
    return true;
  }

  async verifyOtp(email, otp) {
    const user = await authRepository.verifyEmailOtp(email, otp);
    if (!user) throw new Error("Invalid or expired OTP code!");
    return true;
  }
}

module.exports = new AuthService();
