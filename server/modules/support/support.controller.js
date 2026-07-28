const { db } = require("../../src/util/helper");
const authService = require("../auth/auth.service");

// Helper to initialize tables
const initTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(50) NOT NULL,
        business_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS system_feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        rating FLOAT NOT NULL,
        desired_feature VARCHAR(255),
        suggestions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS system_bugs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        steps TEXT,
        expected TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("Failed to initialize Support tables:", err.message);
  }
};

// Initialize tables immediately
initTables();

// Get list of tenants for masquerade dropdown
exports.getTenants = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ success: false, message: "Forbidden: Platform Owner access only" });
    }
    const [rows] = await db.query("SELECT id, name FROM businesses ORDER BY name ASC");
    res.json({ success: true, list: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tenant Masquerade (Requires Token Verification)
exports.masquerade = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ success: false, message: "Forbidden: Platform Owner access only" });
    }

    const { target_business_id, masquerade_token } = req.body;
    if (!target_business_id) {
      return res.status(400).json({ success: false, message: "Target business ID is required" });
    }
    if (!masquerade_token) {
      return res.status(400).json({ success: false, message: "Troubleshooting requires a valid masquerade token authorized by the tenant" });
    }

    // Verify token matches target business
    const [businesses] = await db.query(
      "SELECT support_masquerade_token, support_masquerade_expiry FROM businesses WHERE id = ?",
      [target_business_id]
    );
    if (!businesses || businesses.length === 0) {
      return res.status(404).json({ success: false, message: "Target business not found" });
    }

    const { support_masquerade_token, support_masquerade_expiry } = businesses[0];
    if (!support_masquerade_token || support_masquerade_token !== masquerade_token) {
      return res.status(401).json({ success: false, message: "Invalid masquerade token" });
    }

    if (new Date(support_masquerade_expiry) < new Date()) {
      return res.status(401).json({ success: false, message: "Masquerade token has expired" });
    }

    // Retrieve owner/admin user of that business
    const [users] = await db.query(`
      SELECT u.id, u.business_id, u.branch_id, u.role_id, u.name, u.email,
             r.code as role_code, r.name as role_name,
             b.name as business_name, b.logo as business_logo,
             b.plan_id, b.plan_type, b.active_modules,
             p.name as plan_name,
             p.max_branches, p.max_staff, p.max_products
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN businesses b ON u.business_id = b.id
      JOIN subscription_plans p ON b.plan_id = p.id
      WHERE u.business_id = ? AND r.code = 'owner'
      LIMIT 1
    `, [target_business_id]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No owner account found for target tenant" });
    }

    const targetUser = users[0];
    const loginResponse = await authService.generateLoginResponse(targetUser, false, req);

    res.json({
      success: true,
      message: `Masquerading as tenant ${targetUser.business_name} successful`,
      ...loginResponse
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate support masquerade token for tenant
exports.generateMasqueradeToken = async (req, res) => {
  try {
    const { business_id } = req;
    if (business_id === 1) {
      return res.status(400).json({ success: false, message: "Platform Owner cannot generate masquerade token" });
    }

    // Generate random token: MSQ-XXXXXX
    const token = "MSQ-" + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Expiry: 2 hours from now
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 2);

    await db.query(
      "UPDATE businesses SET support_masquerade_token = ?, support_masquerade_expiry = ? WHERE id = ?",
      [token, expiry, business_id]
    );

    res.json({
      success: true,
      token,
      expiry: expiry.toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tickets API
exports.getTickets = async (req, res) => {
  try {
    const { business_id } = req;
    let sql = "SELECT * FROM support_tickets WHERE business_id = ? ORDER BY id DESC";
    let params = [business_id];

    // If platform owner, retrieve all tickets
    if (business_id === 1) {
      sql = `
        SELECT t.*, b.name as business_name 
        FROM support_tickets t
        JOIN businesses b ON t.business_id = b.id
        ORDER BY t.id DESC
      `;
      params = [];
    }

    const [rows] = await db.query(sql, params);
    res.json({ success: true, list: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { business_id } = req;
    const { title, category, priority, description } = req.body;
    const ticketNumber = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.query(
      "INSERT INTO support_tickets (ticket_number, business_id, title, category, priority, description) VALUES (?, ?, ?, ?, ?, ?)",
      [ticketNumber, business_id, title, category, priority, description]
    );

    res.json({ success: true, message: "Support ticket logged successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Feedback API
exports.createFeedback = async (req, res) => {
  try {
    const { business_id } = req;
    const { rating, desired_feature, suggestions } = req.body;

    await db.query(
      "INSERT INTO system_feedbacks (business_id, rating, desired_feature, suggestions) VALUES (?, ?, ?, ?)",
      [business_id, rating, desired_feature, suggestions]
    );

    res.json({ success: true, message: "Feedback submitted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bug Reports API
exports.createBug = async (req, res) => {
  try {
    const { business_id } = req;
    const { title, severity, steps, expected } = req.body;

    await db.query(
      "INSERT INTO system_bugs (business_id, title, severity, steps, expected) VALUES (?, ?, ?, ?)",
      [business_id, title, severity, steps, expected]
    );

    res.json({ success: true, message: "Bug report submitted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
