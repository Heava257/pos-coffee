const db = require('../../config/database');
const { createHash } = require('crypto'); // Node.js built-in

/**
 * M-2 FIX: OTPs are stored as SHA-256 hashes, never as plaintext.
 * If the DB is read by an attacker, active reset tokens are useless without inversion.
 */
const hashOtp = (otp) => createHash('sha256').update(String(otp)).digest('hex');

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
    // M-2 FIX: compare against stored hash — plaintext OTP is never queried directly
    const otpHash = hashOtp(otp);
    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
      [email, otpHash]
    );
    return users[0] || null;
  }

  async updateResetToken(userId, otpCode, expiry) {
    // M-2 FIX: store hash, not raw OTP
    const otpHash = hashOtp(otpCode);
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [otpHash, expiry, userId]
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
