const { db, logError } = require("../util/helper");

// 1. Get List of Categories (Filtered by Business Activation)
exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    
    let sql;
    let params = [];

    if (business_id === 1) {
      // Platform Admin sees EVERYTHING for management
      sql = `SELECT * FROM categories WHERE business_id = 1 ORDER BY id ASC`;
    } else {
      // Regular Business only sees categories that have been ACTIVATED for them
      sql = `
        SELECT c.* 
        FROM categories c
        INNER JOIN business_categories bc ON c.id = bc.category_id
        WHERE bc.business_id = ? AND bc.is_active = 1
        ORDER BY c.id ASC
      `;
      params = [business_id];
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("category.getList", error, res);
  }
};

// 2. Create Category (Platform Admin Only)
exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    if (business_id !== 1) {
      return res.status(403).json({ message: "Security Violation: You do not have permission to manage global categories." });
    }

    const { name, default_moods, default_sizes, default_addons } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const sql = "INSERT INTO categories (business_id, name, image, default_moods, default_sizes, default_addons) VALUES (1, ?, ?, ?, ?, ?)";
    const [data] = await db.query(sql, [
      name, 
      image, 
      default_moods ? (typeof default_moods === 'object' ? JSON.stringify(default_moods) : default_moods) : null, 
      default_sizes ? (typeof default_sizes === 'object' ? JSON.stringify(default_sizes) : default_sizes) : null, 
      default_addons ? (typeof default_addons === 'object' ? JSON.stringify(default_addons) : default_addons) : null,
    ]);

    res.json({
      success: true,
      data,
      message: "Global category created successfully!"
    });
  } catch (error) {
    logError("category.create", error, res);
  }
};

// 3. Update Category (Platform Admin Only)
exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    if (business_id !== 1) {
      return res.status(403).json({ message: "Security Violation: You do not have permission to manage global categories." });
    }

    const { id, name, default_moods, default_sizes, default_addons } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const sql = `
      UPDATE categories 
      SET name = ?, image = ?, default_moods = ?, default_sizes = ?, default_addons = ? 
      WHERE id = ? AND business_id = 1
    `;
    await db.query(sql, [
      name, 
      image, 
      default_moods ? (typeof default_moods === 'object' ? JSON.stringify(default_moods) : default_moods) : null, 
      default_sizes ? (typeof default_sizes === 'object' ? JSON.stringify(default_sizes) : default_sizes) : null, 
      default_addons ? (typeof default_addons === 'object' ? JSON.stringify(default_addons) : default_addons) : null,
      id
    ]);

    res.json({
      success: true,
      message: "Global category updated successfully!"
    });
  } catch (error) {
    logError("category.update", error, res);
  }
};

// 4. Remove Category (Platform Admin Only)
exports.remove = async (req, res) => {
  try {
    const { business_id } = req;
    if (business_id !== 1) {
      return res.status(403).json({ message: "Security Violation: You do not have permission to manage global categories." });
    }

    const { id } = req.body;

    // Check if category has products in ANY business
    const [products] = await db.query("SELECT id FROM products WHERE category_id = ? LIMIT 1", [id]);
    if (products.length > 0) {
      return res.status(400).json({ message: "Cannot delete category being used by products!" });
    }

    const sql = "DELETE FROM categories WHERE id = ? AND business_id = 1";
    await db.query(sql, [id]);

    res.json({ message: "Global category removed successfully!" });
  } catch (error) {
    logError("category.remove", error, res);
  }
};