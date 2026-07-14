const { db, logError } = require("../../src/util/helper");
const { clearCache } = require("../../src/util/redisClient");

// 1. Get all platform categories with status for a specific business (Filtered by assigned Industry package)
exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    // If I'm admin (1), I can look up categories for any business_id provided, otherwise I look up my own.
    const target_id = (business_id === 1 && req.query.business_id) 
      ? req.query.business_id 
      : business_id;

    let sql;
    let params = [];

    if (Number(target_id) === 1) {
      // Platform Admin sees EVERYTHING for global blueprint management
      sql = `
        SELECT 
          c.id, c.name, c.image, c.default_moods, c.default_sizes, c.default_addons, c.industry_code,
          COALESCE(bc.is_active, 0) AS is_active
        FROM categories c
        LEFT JOIN business_categories bc 
          ON c.id = bc.category_id AND bc.business_id = 1
        WHERE c.business_id = 1
        ORDER BY c.id ASC
      `;
    } else {
      // Standard Business Owner sees ONLY categories belonging to their package's industry
      const [biz] = await db.query(`
        SELECT mp.industry_code 
        FROM businesses b
        LEFT JOIN modular_packages mp ON b.package_id = mp.id
        WHERE b.id = ?
      `, [target_id]);

      const industry_code = biz[0]?.industry_code || 'coffee_cafe'; // Default to coffee_cafe if no package linked

      sql = `
        SELECT 
          c.id, c.name, c.image, c.default_moods, c.default_sizes, c.default_addons, c.industry_code,
          COALESCE(bc.is_active, 0) AS is_active
        FROM categories c
        LEFT JOIN business_categories bc 
          ON c.id = bc.category_id AND bc.business_id = ?
        WHERE c.business_id = 1 AND c.industry_code = ?
        ORDER BY c.id ASC
      `;
      params = [target_id, industry_code];
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("businessCategory.getList", error, res);
  }
};

// 2. Toggle activation (PLATFORM ADMIN OR TENANT FOR SELF with Subscription Plan limits)
exports.toggle = async (req, res) => {
  try {
    const { business_id } = req;
    const { category_id, is_active } = req.body;
    let target_business_id = req.body.target_business_id;

    if (business_id !== 1) {
      target_business_id = business_id;
    } else if (!target_business_id) {
      target_business_id = 1;
    }

    if (!category_id) {
      return res.status(400).json({ message: "category_id is required" });
    }

    // Enforce active category limits based on subscription plan
    if (is_active && Number(target_business_id) !== 1) {
      const [planInfo] = await db.query(`
        SELECT sp.max_categories, sp.name AS plan_name
        FROM businesses b
        INNER JOIN subscription_plans sp ON b.plan_id = sp.id
        WHERE b.id = ?
      `, [target_business_id]);

      if (planInfo.length > 0) {
        const maxCategories = planInfo[0].max_categories || 10;
        const planName = planInfo[0].plan_name;

        // Count current active categories (excluding the one being toggled)
        const [activeCats] = await db.query(`
          SELECT COUNT(*) AS count 
          FROM business_categories 
          WHERE business_id = ? AND is_active = 1 AND category_id != ?
        `, [target_business_id, category_id]);

        const currentActiveCount = activeCats[0].count;

        if (currentActiveCount >= maxCategories) {
          return res.status(403).json({
            error_code: "PLAN_LIMIT_REACHED",
            plan_name: planName,
            max_categories: maxCategories,
            message: `Plan Limit Reached: Your '${planName}' subscription allows a maximum of ${maxCategories} active categories. Please upgrade your plan to activate more.`
          });
        }
      }
    }

    await db.query(`
      INSERT INTO business_categories (business_id, category_id, is_active)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_active = ?
    `, [target_business_id, category_id, is_active ? 1 : 0, is_active ? 1 : 0]);

    await clearCache(`categories_biz_${target_business_id}`);

    res.json({ success: true, message: "Category toggled!" });
  } catch (error) {
    logError("businessCategory.toggle", error, res);
  }
};

// 3. Bulk save activation for a business (PLATFORM ADMIN OR TENANT FOR SELF with Subscription limits)
exports.bulkSave = async (req, res) => {
  const { business_id } = req;
  let target_business_id = req.body.target_business_id;

  if (business_id !== 1) {
    target_business_id = business_id;
  } else if (!target_business_id) {
    target_business_id = 1;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { selections } = req.body; 

    if (!Array.isArray(selections)) {
      return res.status(400).json({ message: "selections are required and must be an array" });
    }

    // Check plan limits first if target business is not admin and we are activating items
    if (Number(target_business_id) !== 1) {
      const activeSelections = selections.filter(sel => sel.is_active);
      if (activeSelections.length > 0) {
        const [planInfo] = await conn.query(`
          SELECT sp.max_categories, sp.name AS plan_name
          FROM businesses b
          INNER JOIN subscription_plans sp ON b.plan_id = sp.id
          WHERE b.id = ?
        `, [target_business_id]);

        if (planInfo.length > 0) {
          const maxCategories = planInfo[0].max_categories || 10;
          const planName = planInfo[0].plan_name;

          if (activeSelections.length > maxCategories) {
            await conn.rollback();
            return res.status(403).json({
              error_code: "PLAN_LIMIT_REACHED",
              plan_name: planName,
              max_categories: maxCategories,
              message: `Plan Limit Reached: Your '${planName}' subscription allows a maximum of ${maxCategories} active categories. You selected ${activeSelections.length}.`
            });
          }
        }
      }
    }

    for (const sel of selections) {
      await conn.query(`
        INSERT INTO business_categories (business_id, category_id, is_active)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
      `, [target_business_id, sel.category_id, sel.is_active ? 1 : 0, sel.is_active ? 1 : 0]);
    }

    await conn.commit();

    await clearCache(`categories_biz_${target_business_id}`);

    res.json({ success: true, message: "Category configurations updated!" });
  } catch (error) {
    await conn.rollback();
    logError("businessCategory.bulkSave", error, res);
  } finally {
    conn.release();
  }
};
