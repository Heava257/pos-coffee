const { db, logError } = require("../../src/util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;

    // Load only categories that this business has ACTIVATED (opted into).
    // If no selections yet (new business), return ALL platform categories as default.
    const [activatedCount] = await db.query(
      "SELECT COUNT(*) AS cnt FROM business_categories WHERE business_id = ?",
      [business_id]
    );

    let categories;
    if (activatedCount[0].cnt > 0) {
      // Business has made their selection — return only active ones
      const [rows] = await db.query(`
        SELECT c.id AS value, c.name AS label, c.default_moods, c.default_sizes, c.default_addons, c.industry_code
        FROM categories c
        INNER JOIN business_categories bc ON c.id = bc.category_id
        WHERE bc.business_id = ? AND bc.is_active = 1
        ORDER BY c.id ASC
      `, [business_id]);
      categories = rows;
    } else {
      // New business — show all platform categories as default
      const [rows] = await db.query(
        "SELECT id AS value, name AS label, default_moods, default_sizes, default_addons, industry_code FROM categories WHERE business_id = 1 ORDER BY id ASC"
      );
      categories = rows;
    }

    const [roles] = await db.query(
      "SELECT id AS value, name AS label FROM roles WHERE business_id = ?",
      [business_id]
    );

    const [suppliers] = await db.query(
      "SELECT id AS value, name AS label FROM suppliers WHERE business_id = ?",
      [business_id]
    );

    const [expense_types] = await db.query(
      "SELECT id AS value, name AS label FROM expense_type WHERE business_id = ?",
      [business_id]
    );

    const [branches] = await db.query(
      "SELECT id AS value, name AS label FROM branches WHERE business_id = ?",
      [business_id]
    );

    const [users] = await db.query(
      "SELECT id AS value, name AS label FROM users WHERE business_id = ?",
      [business_id]
    );

    res.json({
      category: categories,
      role: roles,
      supplier: suppliers,
      expense_type: expense_types,
      branches: branches,
      user: users,
      brand: [
        { label: "Green Grounds", value: "green-grounds" },
        { label: "Local Coffee", value: "local" }
      ],
      unit: [
        { label: "Cup", value: "cup" },
        { label: "Bottle", value: "bottle" },
        { label: "kg", value: "kg" },
        { label: "Set", value: "set" }
      ]
    });
  } catch (error) {
    logError("config.getList", error, res);
  }
};

exports.getProductConfig = async (req, res) => {
  try {
    const { product_id } = req.params;
    // Assuming variations for now, though schema is slightly different
    const [variations] = await db.query(
      "SELECT vo.id AS value, vo.label AS name, vo.extra_price as price FROM variation_options vo JOIN variations v ON vo.variation_id = v.id WHERE v.id = ?",
      [product_id]
    );

    res.json({
      getSizes: variations,
      getAddons: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};