const { db, logError } = require("../util/helper");

// 1. Get all platform categories with status for a specific business
exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    // If I'm admin (1), I can look up categories for any business_id provided, otherwise I look up my own.
    const target_id = (business_id === 1 && req.query.business_id) 
      ? req.query.business_id 
      : business_id;

    const [list] = await db.query(`
      SELECT 
        c.id, c.name, c.image, c.default_moods, c.default_sizes, c.default_addons,
        COALESCE(bc.is_active, 0) AS is_active
      FROM categories c
      LEFT JOIN business_categories bc 
        ON c.id = bc.category_id AND bc.business_id = ?
      WHERE c.business_id = 1
      ORDER BY c.id ASC
    `, [target_id]);

    res.json({ list });
  } catch (error) {
    logError("businessCategory.getList", error, res);
  }
};

// 2. Toggle activation (PLATFORM ADMIN ONLY)
exports.toggle = async (req, res) => {
  try {
    const { business_id } = req;
    const { target_business_id, category_id, is_active } = req.body;

    if (business_id !== 1) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    if (!target_business_id || !category_id) {
      return res.status(400).json({ message: "target_business_id and category_id are required" });
    }

    await db.query(`
      INSERT INTO business_categories (business_id, category_id, is_active)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_active = ?
    `, [target_business_id, category_id, is_active ? 1 : 0, is_active ? 1 : 0]);

    res.json({ success: true, message: "Category toggled!" });
  } catch (error) {
    logError("businessCategory.toggle", error, res);
  }
};

// 3. Bulk save activation for a business (PLATFORM ADMIN ONLY)
exports.bulkSave = async (req, res) => {
  const { business_id } = req;
  if (business_id !== 1) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { target_business_id, selections } = req.body; 

    if (!target_business_id || !Array.isArray(selections)) {
      return res.status(400).json({ message: "target_business_id and selections are required" });
    }

    for (const sel of selections) {
      await conn.query(`
        INSERT INTO business_categories (business_id, category_id, is_active)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
      `, [target_business_id, sel.category_id, sel.is_active ? 1 : 0, sel.is_active ? 1 : 0]);
    }

    await conn.commit();
    res.json({ success: true, message: "Category configurations updated!" });
  } catch (error) {
    await conn.rollback();
    logError("businessCategory.bulkSave", error, res);
  } finally {
    conn.release();
  }
};
