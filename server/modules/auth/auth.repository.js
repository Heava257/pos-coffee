const db = require("../../config/database");

class AuthRepository {
  async findUserByEmail(email) {
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
    return users[0] || null;
  }

  async findUserById(id) {
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
    return users[0] || null;
  }

  async verifyEmailOtp(email, otp) {
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()",
      [email, otp]
    );
    return users[0] || null;
  }

  async updateResetToken(userId, otpCode, expiry) {
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [otpCode, expiry, userId]
    );
  }

  async updatePasswordAndClearReset(userId, hashedPassword) {
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, userId]
    );
  }

  async markEmailAsVerified(userId) {
    await db.query(
      "UPDATE users SET is_verified = 1, verify_token = NULL WHERE id = ?",
      [userId]
    );
  }

  async findUserByVerifyToken(email, token) {
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? AND verify_token = ?",
      [email, token]
    );
    return users[0] || null;
  }

  async updateUserImage(userId, image) {
    await db.query("UPDATE users SET image = ? WHERE id = ?", [image, userId]);
  }
}

module.exports = new AuthRepository();
