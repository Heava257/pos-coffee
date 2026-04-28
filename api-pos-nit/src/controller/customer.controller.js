const axios = require('axios');
const { db, logError } = require("../util/helper");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("222467462843-3mc4kb1636gcpugur0cgmb4mbdgfpbfl.apps.googleusercontent.com");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;

    let params = [business_id];
    let sql = `
      SELECT c.*, t.name as tier_name, t.discount_rate 
      FROM customers c 
      LEFT JOIN membership_tiers t ON c.tier_id = t.id 
      WHERE c.business_id = ?
    `;

    if (txtSearch) {
      sql += " AND (c.name LIKE ? OR c.phone LIKE ? OR c.card_number = ?)";
      params.push(`%${txtSearch}%`, `%${txtSearch}%`, txtSearch);
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("customer.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    const { name, phone, email, address, tier_id } = req.body;

    const sql = "INSERT INTO customers (business_id, name, phone, email, address, tier_id) VALUES (?, ?, ?, ?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, phone, email, address, tier_id]);

    res.json({
      success: true,
      message: "Customer created successfully!",
      id: data.insertId
    });
  } catch (error) {
    logError("customer.create", error, res);
  }
};

exports.publicCreate = async (req, res) => {
  try {
    const { business_id, name, phone } = req.body;
    if (!business_id || !name || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 1. Check if already exists
    console.log("Checking existence for:", { phone, business_id });
    const [existing] = await db.query("SELECT id FROM customers WHERE phone = ? AND business_id = ?", [phone, business_id]);
    console.log("Existing records found:", existing.length);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "This phone number is already registered." });
    }

    // 2. Fetch default tier (lowest discount or first one)
    const [tiers] = await db.query("SELECT id FROM membership_tiers ORDER BY discount_rate ASC LIMIT 1");
    const tier_id = tiers.length > 0 ? tiers[0].id : null;

    // 3. Insert
    const { email } = req.body;
    const sql = "INSERT INTO customers (business_id, name, phone, email, tier_id, card_number) VALUES (?, ?, ?, ?, ?, ?)";
    const card_number = "M" + phone.slice(-6) + Math.floor(Math.random() * 1000); // Simple unique card gen
    const [data] = await db.query(sql, [business_id, name, phone, email, tier_id, card_number]);

    // 4. Return new customer info
    const [newCust] = await db.query(
      "SELECT c.*, t.name as tier_name FROM customers c LEFT JOIN membership_tiers t ON c.tier_id = t.id WHERE c.id = ?",
      [data.insertId]
    );

    res.json({
      success: true,
      message: "Welcome to our loyalty program!",
      data: newCust[0]
    });
  } catch (error) {
    logError("customer.publicCreate", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    const { id, name, phone, email, address } = req.body;

    const sql = "UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND business_id = ?";
    await db.query(sql, [name, phone, email, address, id, business_id]);

    res.json({ message: "Customer updated successfully!" });
  } catch (error) {
    logError("customer.update", error, res);
  }
};

exports.publicUpdate = async (req, res) => {
  try {
    const { id, name, email } = req.body;
    if (!id || !name || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sql = "UPDATE customers SET name = ?, email = ? WHERE id = ?";
    await db.query(sql, [name, email, id]);

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (error) {
    logError("customer.publicUpdate", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    await db.query("DELETE FROM customers WHERE id = ? AND business_id = ?", [id, business_id]);
    res.json({ message: "Customer removed successfully!" });
  } catch (error) {
    logError("customer.remove", error, res);
  }
};

exports.topup = async (req, res) => {
  try {
    const { id, amount } = req.body;
    const { business_id } = req;

    const sql = "UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id = ? AND business_id = ?";
    await db.query(sql, [amount, id, business_id]);

    res.json({ success: true, message: "Top-up successful!" });
  } catch (error) {
    logError("customer.topup", error, res);
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT c.*, t.name as tier_name, t.discount_rate, t.min_points as current_min FROM customers c LEFT JOIN membership_tiers t ON c.tier_id = t.id WHERE c.card_number = ? OR c.phone = ? OR c.id = ?";
    const [data] = await db.query(sql, [id, id, id]);
    if (data.length > 0) {
      const customer = data[0];
      // Find next tier
      const [nextTier] = await db.query("SELECT name, min_points FROM membership_tiers WHERE min_points > ? ORDER BY min_points ASC LIMIT 1", [customer.points || 0]);
      
      res.json({ 
        success: true, 
        data: {
          ...customer,
          next_tier: nextTier.length > 0 ? nextTier[0] : null
        } 
      });
    } else {
      res.json({ success: false, message: "Member not found" });
    }
  } catch (error) {
    logError("customer.getDetail", error, res);
  }
};

exports.getInactive = async (req, res) => {
  try {
    const { business_id } = req;
    const { days = 30 } = req.query;

    const sql = `
      SELECT 
        c.*, 
        t.name as tier_name,
        MAX(o.created_at) as last_order_date,
        DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order
      FROM customers c
      LEFT JOIN membership_tiers t ON c.tier_id = t.id
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.business_id = ?
      GROUP BY c.id
      HAVING days_since_last_order >= ? OR last_order_date IS NULL
      ORDER BY days_since_last_order DESC
    `;
    const [list] = await db.query(sql, [business_id, days]);
    res.json({ list });
  } catch (error) {
    logError("customer.getInactive", error, res);
  }
};

exports.getMarketingStats = async (req, res) => {
  try {
    const { business_id } = req;
    
    // 1. Total Customers
    const [totalCust] = await db.query(
      "SELECT COUNT(id) as total FROM customers WHERE business_id = ?",
      [business_id]
    );

    // 2. Inactive Customers (> 30 days)
    const [inactiveCust] = await db.query(`
      SELECT COUNT(DISTINCT c.id) as count
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.business_id = ?
      AND (
        DATEDIFF(NOW(), (SELECT MAX(created_at) FROM orders WHERE customer_id = c.id)) >= 30
        OR NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = c.id)
      )
    `, [business_id]);

    // 3. Recovery Rate (Customers who were inactive but ordered in the last 7 days)
    // For now, let's use a simplified calculation or return 0 if no historical data
    const recoveryRate = 0; 

    res.json({
      total_members: totalCust[0]?.total || 0,
      inactive_count: inactiveCust[0]?.count || 0,
      recovery_rate: recoveryRate
    });
  } catch (error) {
    logError("customer.getMarketingStats", error, res);
  }
};

const nodemailer = require('nodemailer');

exports.sendPromoEmail = async (req, res) => {
  try {
    const { customer_id, promo_text, platform_url } = req.body;
    const { business_id } = req;

    if (!customer_id) {
        return res.status(400).json({ success: false, message: "Missing customer ID" });
    }

    // Fetch Customer and Business Info
    const [custData] = await db.query("SELECT * FROM customers WHERE id = ?", [customer_id]);
    const [bizData] = await db.query("SELECT name, smtp_user, smtp_pass FROM businesses WHERE id = ?", [business_id]);
    
    if (custData.length === 0 || !custData[0].email) {
      return res.json({ success: false, message: "Customer email not found" });
    }

    const customer = custData[0];
    const bizName = bizData[0]?.name || "Our Shop";
    const smtpUser = bizData[0]?.smtp_user || process.env.SMTP_USER;
    const rawSmtpPass = bizData[0]?.smtp_pass || process.env.SMTP_PASS;
    const smtpPass = rawSmtpPass ? rawSmtpPass.replace(/\s/g, "") : "";

    if (!smtpUser || !smtpPass) {
        return res.json({ success: false, message: "Email server (SMTP) not configured for this business." });
    }

    // 🚀 USE BREVO API (HTTP) - Bypass Railway SMTP blocks
    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: bizName, email: smtpUser },
        to: [{ email: customer.email, name: customer.name }],
        subject: `Special Offer from ${bizName}! ☕`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4A6741; margin: 0; text-transform: uppercase;">${bizName}</h1>
              <p style="color: #8A8070; font-size: 12px; letter-spacing: 2px;">LOYALTY PROGRAM</p>
            </div>
            <h2 style="color: #1C1C1C;">Hello ${customer.name},</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              We miss you at <b>${bizName}</b>! It has been a while since your last visit. We'd love to see you again soon.
            </p>
            <div style="background: #F5F0E8; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 1px dashed #C0A060;">
              <p style="font-size: 20px; font-weight: 800; color: #1C1C1C; margin: 0;">${promo_text || "Get 15% OFF on your next drink!"}</p>
              <p style="font-size: 12px; color: #8A8070; margin-top: 10px;">Use code: <b>WELCOMEBACK</b></p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${platform_url || "https://pos-coffee-web-production.up.railway.app"}/customer/menu?biz=${business_id}" style="background: #4A6741; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Order Now</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0 20px;">
            <p style="font-size: 11px; color: #aaa; text-align: center; line-height: 1.5;">
              You received this email because you are a valued member of ${bizName} Loyalty Program.
            </p>
          </div>
        `
      }, {
        headers: {
          'api-key': smtpPass,
          'Content-Type': 'application/json'
        }
      });
      res.json({ success: true, message: "Promotion email sent successfully via API!" });
    } catch (apiError) {
      console.error("Brevo API Error:", apiError.response?.data || apiError.message);
      res.json({ success: false, message: "Failed to send email via API." });
    }

  } catch (error) {
    console.error("Email Error:", error);
    res.json({ 
        success: false, 
        message: `Failed to send email: ${error.message}` 
    });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { loginValue, business_id } = req.body;
    if (!loginValue || !business_id) return res.json({ success: false, message: "Missing phone or business ID" });

    const [cust] = await db.query("SELECT * FROM customers WHERE (phone = ? OR card_number = ?) AND business_id = ?", [loginValue, loginValue, business_id]);
    if (cust.length === 0) return res.json({ success: false, message: "Member not found" });
    
    const customer = cust[0];
    if (!customer.email) return res.json({ success: false, message: "No email associated with this account. Please contact staff." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.query("UPDATE customers SET otp_code = ?, otp_expiry = ? WHERE id = ?", [otp, expiry, customer.id]);

    const [bizData] = await db.query("SELECT name, smtp_user, smtp_pass FROM businesses WHERE id = ?", [business_id]);
    const bizName = bizData[0]?.name || "Our Shop";
    const smtpUser = bizData[0]?.smtp_user || process.env.SMTP_USER;
    const rawSmtpPass = bizData[0]?.smtp_pass || process.env.SMTP_PASS;
    const smtpPass = rawSmtpPass ? rawSmtpPass.replace(/\s/g, "") : "";

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: bizName, email: smtpUser },
      to: [{ email: customer.email }],
      subject: `Your Verification Code: ${otp}`,
      htmlContent: `
        <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #f9f9f9;">
          <h1 style="color: #4A6741;">Verification</h1>
          <p style="font-size: 16px; color: #555;">Use this code to login:</p>
          <div style="font-size: 32px; font-weight: 800; color: #1C1C1C; margin: 20px 0; letter-spacing: 5px;">${otp}</div>
          <p style="font-size: 12px; color: #999;">Expires in 10 minutes.</p>
        </div>
      `
    }, {
      headers: { 'api-key': smtpPass, 'Content-Type': 'application/json' }
    });

    res.json({ success: true, message: "Code sent to " + customer.email });
  } catch (error) {
    logError("customer.sendOTP", error, res);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { loginValue, otp, business_id } = req.body;
    const [cust] = await db.query(
      "SELECT c.*, t.name as tier_name FROM customers c LEFT JOIN membership_tiers t ON c.tier_id = t.id WHERE (c.phone = ? OR c.card_number = ?) AND c.business_id = ?", 
      [loginValue, loginValue, business_id]
    );

    if (cust.length === 0) return res.json({ success: false, message: "Member not found" });
    const customer = cust[0];

    if (customer.otp_code !== otp) return res.json({ success: false, message: "Invalid verification code" });
    if (new Date() > new Date(customer.otp_expiry)) return res.json({ success: false, message: "OTP has expired" });

    await db.query("UPDATE customers SET otp_code = NULL, otp_expiry = NULL WHERE id = ?", [customer.id]);
    res.json({ success: true, data: customer });
  } catch (error) {
    logError("customer.verifyOTP", error, res);
  }
};

exports.redeemReward = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { customer_id, business_id, reward_name, stars_cost } = req.body;
    if (!customer_id || !stars_cost) return res.json({ success: false, message: "Missing info" });

    await conn.beginTransaction();

    // 1. Check points
    const [cust] = await conn.query("SELECT points, email, name FROM customers WHERE id = ?", [customer_id]);
    if (cust.length === 0) throw new Error("Customer not found");
    const customer = cust[0];

    if (customer.points < stars_cost) {
      await conn.rollback();
      return res.json({ success: false, message: "Not enough stars!" });
    }

    // 2. Deduct points
    await conn.query("UPDATE customers SET points = points - ? WHERE id = ?", [stars_cost, customer_id]);

    // 3. Record redeem
    await conn.query(
      "INSERT INTO customer_redeems (customer_id, business_id, reward_name, stars_used) VALUES (?, ?, ?, ?)",
      [customer_id, business_id, reward_name, stars_cost]
    );

    // 4. Fetch SMTP for confirmation email
    const [bizData] = await conn.query("SELECT name, smtp_user, smtp_pass FROM businesses WHERE id = ?", [business_id]);
    const bizName = bizData[0]?.name || "Our Shop";
    const smtpUser = bizData[0]?.smtp_user || process.env.SMTP_USER;
    const rawSmtpPass = bizData[0]?.smtp_pass || process.env.SMTP_PASS;
    const smtpPass = rawSmtpPass ? rawSmtpPass.replace(/\s/g, "") : "";

    if (customer.email && smtpUser && smtpPass) {
      // 🚀 USE BREVO API (HTTP)
      try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
          sender: { name: bizName, email: smtpUser },
          to: [{ email: customer.email, name: customer.name }],
          subject: `Reward Redeemed: ${reward_name}`,
          htmlContent: `
            <div style="font-family: sans-serif; padding: 40px; background: #f9f9f9;">
              <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 20px;">
                <h2 style="color: #4A6741; text-align: center;">Congratulations!</h2>
                <p style="text-align: center;">You've successfully redeemed <b>${stars_cost} Stars</b> for:</p>
                <div style="background: #F5F0E8; padding: 20px; border-radius: 12px; text-align: center; font-size: 20px; font-weight: 800; margin: 20px 0;">
                  ${reward_name}
                </div>
                <p style="text-align: center; font-size: 13px; color: #666;">Please show this email to our staff to claim your reward.</p>
              </div>
            </div>
          </div>
        `
      }).catch(e => console.error("Email send fail", e));
    }

    await conn.commit();
    res.json({ success: true, message: "Reward redeemed successfully!" });
  } catch (error) {
    await conn.rollback();
    logError("customer.redeemReward", error, res);
  } finally {
    conn.release();
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, business_id, isCustom, profile } = req.body;
    if (!business_id) return res.json({ success: false, message: "Missing business ID" });

    let email, name, picture, google_id;

    if (isCustom && profile) {
      // 🛡️ Custom Flow (Client-side fetched profile)
      email = profile.email;
      name = profile.name;
      picture = profile.picture;
      google_id = profile.sub;
    } else {
      // 🔒 Standard ID Token Flow
      if (!token) return res.json({ success: false, message: "Missing token" });
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: "222467462843-3mc4kb1636gcpugur0cgmb4mbdgfpbfl.apps.googleusercontent.com"
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      google_id = payload.sub;
    }

    if (!email || !google_id) return res.json({ success: false, message: "Could not retrieve Google profile info" });

    // 2. Check if customer exists by email or google_id
    const [existing] = await db.query(
      "SELECT c.*, t.name as tier_name FROM customers c LEFT JOIN membership_tiers t ON c.tier_id = t.id WHERE (c.email = ? OR c.google_id = ?) AND c.business_id = ?",
      [email, google_id, business_id]
    );

    if (existing.length > 0) {
      // Update google_id or profile_image if not set
      if (!existing[0].google_id || !existing[0].profile_image) {
        await db.query("UPDATE customers SET google_id = ?, profile_image = ? WHERE id = ?", [google_id, picture, existing[0].id]);
      }
      return res.json({ success: true, data: existing[0] });
    }

    // 3. Create new customer if not exists
    const [tiers] = await db.query("SELECT id FROM membership_tiers ORDER BY discount_rate ASC LIMIT 1");
    const tier_id = tiers.length > 0 ? tiers[0].id : null;
    const card_number = "G" + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');

    const sql = "INSERT INTO customers (business_id, name, email, google_id, tier_id, card_number, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, email, google_id, tier_id, card_number, picture]);

    const [newCust] = await db.query(
      "SELECT c.*, t.name as tier_name FROM customers c LEFT JOIN membership_tiers t ON c.tier_id = t.id WHERE c.id = ?",
      [data.insertId]
    );

    res.json({ success: true, data: newCust[0] });
  } catch (error) {
    logError("customer.googleLogin", error, res);
  }
};
