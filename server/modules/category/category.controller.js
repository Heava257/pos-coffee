const { db, logError } = require("../../src/util/helper");
const { getCache, setCache, clearCache } = require("../../src/util/redisClient");

// 1. Get List of Categories (Filtered by Business Activation)
exports.getList = async (req, res) => {
  try {
    const business_id = req.business_id || req.query.business_id;
    if (!business_id) return res.json({ list: [] });
    
    const include_inactive = req.query.all === "1" || req.query.include_inactive === "1";
    const cacheKey = `categories_biz_${business_id}_all_${include_inactive ? 1 : 0}`;

    /*
    // 1. Check Redis Cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ list: cachedData, source: "redis" });
    }
    */
    
    let sql;
    let params = [];

    if (business_id === 1) {
      // Platform Admin sees EVERYTHING for management
      sql = `SELECT *, 1 as is_active FROM categories WHERE business_id = 1 ORDER BY id ASC`;
    } else if (include_inactive) {
      const [biz] = await db.query(`
        SELECT mp.code, mp.industry_code 
        FROM businesses b
        LEFT JOIN modular_packages mp ON b.package_id = mp.id
        WHERE b.id = ?
      `, [business_id]);
      
      let industry_code = "coffee_cafe";
      if (biz.length > 0) {
        const pkg = biz[0];
        const code = pkg.code;
        if (code === "mart" || pkg.industry_code === "retail") {
          industry_code = "mart";
        } else {
          industry_code = pkg.industry_code || code || "coffee_cafe";
        }
      }

      sql = `
        SELECT c.*, 
               IF(c.business_id = 1, COALESCE(bc.is_active, 0), 1) AS is_active
        FROM categories c
        LEFT JOIN business_categories bc ON c.id = bc.category_id AND bc.business_id = ?
        WHERE (c.business_id = 1 AND c.industry_code = ?) OR (c.business_id = ?)
        ORDER BY c.id ASC
      `;
      params = [business_id, industry_code, business_id];
    } else {
      // Show BOTH and SORT by popularity (order volume)
      sql = `
        SELECT c.*, 1 as is_active,
               (SELECT COUNT(od.id) 
                FROM order_details od 
                JOIN products p ON od.product_id = p.id 
                JOIN orders o ON od.order_id = o.id
                WHERE p.category_id = c.id AND o.business_id = ? AND o.status != 'cancelled'
               ) as total_orders
        FROM categories c
        LEFT JOIN business_categories bc ON c.id = bc.category_id AND bc.business_id = ?
        WHERE (bc.business_id = ? AND bc.is_active = 1) OR (c.business_id = ?)
        GROUP BY c.id
        ORDER BY total_orders DESC, c.name ASC
      `;
      params = [business_id, business_id, business_id, business_id];
    }

    const [list] = await db.query(sql, params);
    
    // 2. Set Redis Cache
    await setCache(cacheKey, list, 3600); // cache for 1 hour

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

    const { name, industry_code, default_moods, default_sizes, default_addons } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const sql = "INSERT INTO categories (business_id, name, industry_code, image, default_moods, default_sizes, default_addons) VALUES (1, ?, ?, ?, ?, ?, ?)";
    const [data] = await db.query(sql, [
      name, 
      industry_code || 'coffee_cafe',
      image, 
      default_moods ? (typeof default_moods === 'object' ? JSON.stringify(default_moods) : default_moods) : null, 
      default_sizes ? (typeof default_sizes === 'object' ? JSON.stringify(default_sizes) : default_sizes) : null, 
      default_addons ? (typeof default_addons === 'object' ? JSON.stringify(default_addons) : default_addons) : null,
    ]);

    // Clear Category Cache globally when changed
    await clearCache("categories_biz_*");

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

    const { id, name, industry_code, default_moods, default_sizes, default_addons } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const sql = `
      UPDATE categories 
      SET name = ?, industry_code = ?, image = ?, default_moods = ?, default_sizes = ?, default_addons = ? 
      WHERE id = ? AND business_id = 1
    `;
    await db.query(sql, [
      name, 
      industry_code || 'coffee_cafe',
      image, 
      default_moods ? (typeof default_moods === 'object' ? JSON.stringify(default_moods) : default_moods) : null, 
      default_sizes ? (typeof default_sizes === 'object' ? JSON.stringify(default_sizes) : default_sizes) : null, 
      default_addons ? (typeof default_addons === 'object' ? JSON.stringify(default_addons) : default_addons) : null,
      id
    ]);

    await clearCache("categories_biz_*");

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
    if (!id) return res.status(400).json({ message: "Category ID is required!" });

    // Check if category has products in ANY business
    const [products] = await db.query("SELECT id FROM products WHERE category_id = ? LIMIT 1", [id]);
    if (products.length > 0) {
      return res.status(400).json({ message: "Cannot delete category being used by products! Please remove or reassign those products first." });
    }

    const sql = "DELETE FROM categories WHERE id = ? AND business_id = 1";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found or already removed." });
    }

    await clearCache("categories_biz_*");
    res.json({ message: "Global category removed successfully!" });
  } catch (error) {
    logError("category.remove", error, res);
  }
};

// Composite extensions added during modular migration
const businessCategoryController = require("./business_category.controller");
module.exports = {
  ...module.exports,
  getBusinessCategories: businessCategoryController.getList,
  toggleBusinessCategory: businessCategoryController.toggle,
  bulkSaveBusinessCategories: businessCategoryController.bulkSave
};
