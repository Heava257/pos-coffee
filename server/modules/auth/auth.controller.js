const authService = require("./auth.service");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const db = require("../../config/database");
const loginRateLimiter = require("../../src/util/loginRateLimiter");
const { logError } = require("../../src/util/logError");

class AuthController {
  async register(req, res) {
    try {
      const clientUrl = req.get('origin') || req.get('referer');
      const result = await authService.register(req.body, clientUrl);
      res.json(result);
    } catch (error) {
      logError("auth.register", error, res);
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body.email, req.body.password, req.body.remember, req);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json(result);
    } catch (error) {
      logError("auth.login", error, res);
    }
  }

  async googleLogin(req, res) {
    try {
      const result = await authService.googleLogin(req.body.access_token, req);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json(result);
    } catch (error) {
      logError("auth.googleLogin", error, res);
    }
  }

  async loginByPassword(req, res) {
    try {
      const result = await authService.loginByPassword(req.body.id, req.body.password, req.business_id, req);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json(result);
    } catch (error) {
      logError("auth.loginByPassword", error, res);
    }
  }

  async verifyManager(req, res) {
    try {
      const result = await authService.verifyManager(req.body.username, req.body.password, req.business_id);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json({
        success: true,
        message: "Manager verification successful",
        ...result
      });
    } catch (error) {
      logError("auth.verifyManager", error, res);
    }
  }

  async getProfile(req, res) {
    try {
      const result = await authService.generateLoginResponse({
        id: req.user_id,
        business_id: req.business_id,
        branch_id: req.branch_id,
        role_id: req.role_id,
        name: req.auth.name,
        email: req.auth.email,
        plan_name: req.auth.plan_name,
        max_branches: req.auth.plan_limits.branches,
        max_staff: req.auth.plan_limits.staff,
        max_products: req.auth.plan_limits.products,
        business_name: req.auth.business_name,
        role_name: req.auth.role_name,
        role_code: req.auth.role_code,
        business_logo: req.auth.business_logo,
        image: req.auth.profile_image,
        active_modules: req.auth.active_modules,
        plan_type: req.auth.plan_type,
        plan_id: req.auth.plan_id,
        business_layout: req.auth.business_layout
      }, false, req);
      res.json(result);
    } catch (error) {
      logError("auth.getProfile", error, res);
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, password, email, pin_code } = req.body;
      const user_id = req.user_id;
      const image = req.file?.path || req.file?.filename;

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

      if (password && password.trim() !== '') {
        // C-4 FIX: async bcrypt.hash — hashSync blocks the event loop
        const hashedPassword = await require('bcrypt').hash(password, 12);
        sql += ', password = ?';
        params.push(hashedPassword);
      }

      sql += " WHERE id = ?";
      params.push(user_id);

      await db.query(sql, params);

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
  }

  async verifyEmail(req, res) {
    try {
      const { token, email } = req.body;
      await authService.verifyEmail(token, email);
      res.json({ success: true, message: "Email verified successfully!" });
    } catch (error) {
      logError("auth.verifyEmail", error, res);
    }
  }

  async forgotPassword(req, res) {
    try {
      await authService.forgotPassword(req.body.email);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json({ success: true, message: "6-digit OTP code has been sent to your email!" });
    } catch (error) {
      logError("auth.forgotPassword", error, res);
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, new_password } = req.body;
      await authService.resetPassword(email, otp, new_password);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json({ success: true, message: "Password has been reset successfully!" });
    } catch (error) {
      logError("auth.resetPassword", error, res);
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      await authService.verifyOtp(email, otp);
      try { loginRateLimiter.resetKey(req.ip); } catch (e) {}
      res.json({ success: true, message: "OTP verified successfully!" });
    } catch (error) {
      logError("auth.verifyOtp", error, res);
    }
  }

  async guestAccess(req, res) {
    try {
      const { biz, branch, table } = req.query;
      const [bizRows] = await db.query("SELECT id, name FROM businesses WHERE id = ? AND status = 'active'", [biz]);
      if (bizRows.length === 0) return res.status(404).json({ message: "Shop not found or inactive" });

      const [branchRows] = await db.query("SELECT id, name FROM branches WHERE id = ? AND business_id = ?", [branch, biz]);
      if (branchRows.length === 0) return res.status(404).json({ message: "Branch not found" });

      const payload = {
        business_id: parseInt(biz),
        branch_id: parseInt(branch),
        table_no: table || "Walk-in",
        role_code: "guest",
        permissions: ["product", "category", "order"]
      };

      const token = jwt.sign(payload, config.token.access_token_key, { expiresIn: "4h" });

      res.json({
        access_token: token,
        permissions: payload.permissions,
        profile: {
          business_id: payload.business_id,
          branch_id: payload.branch_id,
          business_name: bizRows[0].name,
          branch_name: branchRows[0].name,
          table_no: table
        }
      });
    } catch (error) {
      logError("guest.access", error, res);
    }
  }
}

module.exports = new AuthController();
