const { db, isArray, isEmpty, logError } = require("../util/helper");


exports.getList = async (req, res) => {
  try {
    const { parent_id } = req.query;
    let sql;
    let params = {};

    // Multi-tenant check: Filter by company_id from JWT
    const { company_id, role } = req.auth;
    const isPlatformAdmin = role === 'admin';

    if (isPlatformAdmin) {
      // Platform Admin sees everything
      sql = `
        SELECT 
          c.*,
          c.parent_id AS parentid,
          u.name as created_by_name,
          p.name AS parent_name,
          p.icon AS parent_icon
        FROM category c
        LEFT JOIN category p ON c.parent_id = p.id
        LEFT JOIN user u ON c.user_id = u.id
        WHERE 1=1
      `;
    } else {
      // Standard users only see data for their specific company
      sql = `
        SELECT 
          c.*,
          c.parent_id AS parentid,
          u.name as created_by_name,
          p.name AS parent_name,
          p.icon AS parent_icon
        FROM category c
        LEFT JOIN category p ON c.parent_id = p.id
        LEFT JOIN user u ON c.user_id = u.id
        WHERE c.company_id = :company_id
      `;
      params.company_id = company_id;
    }

    // Filter by parent_id if provided and valid
    if (parent_id && parent_id !== "all" && parent_id !== "undefined" && parent_id !== "null") {
      const numericParentId = Number(parent_id);
      if (!isNaN(numericParentId) && isFinite(numericParentId)) {
        sql += " AND c.parent_id = :parent_id";
        params.parent_id = numericParentId;
      }
    }

    sql += " ORDER BY c.parent_id, c.id DESC";

    const [list] = await db.query(sql, params);

    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
      is_super_admin: isSuperAdmin,
      debug: {
        current_user_id: req.current_id,
        parent_id_filter: parent_id,
        total_categories: list.length,
        is_super_admin: isSuperAdmin
      }
    });

  } catch (error) {
    logError("category.getList", error, res);
  }
};


exports.seedDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = [
      { name: "Coffee", description: "Coffee beverages", icon: "☕" },
      { name: "Juice", description: "Fresh juices", icon: "🧃" },
      { name: "Milk Based", description: "Milk-based drinks", icon: "🥛" },
      { name: "Snack", description: "Light snacks", icon: "🍪" },
      { name: "Rice", description: "Rice dishes", icon: "🍚" },
      { name: "Dessert", description: "Sweet desserts", icon: "🍰" }
    ];

    // Get all groups
    const [groups] = await db.query(`
      SELECT DISTINCT group_id, MIN(id) as sample_user_id 
      FROM user 
      WHERE group_id IS NOT NULL 
      GROUP BY group_id
    `);

    let createdCount = 0;
    for (const group of groups) {
      for (const category of defaultCategories) {
        // Check if category already exists for this group
        const [existing] = await db.query(`
          SELECT COUNT(*) as count FROM category c
          INNER JOIN user u ON c.user_id = u.id
          WHERE u.group_id = ? AND c.name = ?
        `, [group.group_id, category.name]);

        if (existing[0].count === 0) {
          await db.query(`
            INSERT INTO category (name, description, status, parent_id, icon, user_id) 
            VALUES (?, ?, 1, 0, ?, ?)
          `, [category.name, category.description, category.icon, group.sample_user_id]);
          createdCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Seeded ${createdCount} default categories across ${groups.length} groups`,
      groups_processed: groups.length,
      categories_created: createdCount
    });
  } catch (error) {
    logError("category.seedDefaultCategories", error, res);
  }
};
// OPTION 1: Get categories that ARE used as parent_id (true parent categories) - with group filtering
exports.getParentCategories = async (req, res) => {
  try {
    let sql;
    let params = {};

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;

    if (isSuperAdmin) {
      sql = `
        SELECT DISTINCT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        WHERE c.id IN (
          SELECT DISTINCT parent_id 
          FROM category 
          WHERE parent_id IS NOT NULL
        )
        ORDER BY c.id ASC
      `;
    } else {
      sql = `
        SELECT DISTINCT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        INNER JOIN user cu ON cu.group_id = u.group_id
        WHERE c.id IN (
          SELECT DISTINCT parent_id 
          FROM category 
          WHERE parent_id IS NOT NULL
        )
        AND cu.id = :current_user_id
        ORDER BY c.id ASC
      `;
      params.current_user_id = req.current_id;
    }

    const [list] = await db.query(sql, params);

    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
      is_super_admin: isSuperAdmin,
      debug: {
        current_user_id: req.current_id,
        total_parent_categories: list.length,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (error) {
    logError("category.getParentCategories", error, res);
  }
};

// OPTION 2: Get categories where parent_id IS NULL (root categories) - with group filtering
exports.getParentCategoriesAlternative = async (req, res) => {
  try {
    let sql;
    let params = {};

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;

    if (isSuperAdmin) {
      sql = `
        SELECT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        WHERE c.parent_id IS NULL 
        ORDER BY c.id ASC
      `;
    } else {
      sql = `
        SELECT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        INNER JOIN user cu ON cu.group_id = u.group_id
        WHERE c.parent_id IS NULL 
        AND cu.id = :current_user_id
        ORDER BY c.id ASC
      `;
      params.current_user_id = req.current_id;
    }

    const [list] = await db.query(sql, params);

    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
      is_super_admin: isSuperAdmin,
      debug: {
        current_user_id: req.current_id,
        total_root_categories: list.length,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (error) {
    logError("category.getParentCategoriesAlternative", error, res);
  }
};

// OPTION 3: Hardcoded approach if you know your parent IDs - with group filtering
exports.getParentCategoriesHardcoded = async (req, res) => {
  try {
    const parentIds = [51, 52, 53, 54, 55, 56]; // Your known parent IDs
    let sql;
    let params = {};

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;

    if (isSuperAdmin) {
      sql = `
        SELECT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        WHERE c.id IN (${parentIds.join(',')})
        ORDER BY c.id ASC
      `;
    } else {
      sql = `
        SELECT c.*, u.group_id, u.name as created_by_name, u.username as created_by_username
        FROM category c
        INNER JOIN user u ON c.user_id = u.id
        INNER JOIN user cu ON cu.group_id = u.group_id
        WHERE c.id IN (${parentIds.join(',')})
        AND cu.id = :current_user_id
        ORDER BY c.id ASC
      `;
      params.current_user_id = req.current_id;
    }

    const [list] = await db.query(sql, params);

    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
      expected_count: 6,
      found_count: list.length,
      missing_ids: parentIds.filter(id => !list.find(cat => cat.id === id)),
      is_super_admin: isSuperAdmin,
      debug: {
        current_user_id: req.current_id,
        searched_parent_ids: parentIds,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (error) {
    logError("category.getParentCategoriesHardcoded", error, res);
  }
};

// DEBUGGING: Check your category structure - with group filtering
exports.debugCategoryStructure = async (req, res) => {
  try {
    let sql;
    let params = {};

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;

    if (isSuperAdmin) {
      // Get all categories with their parent info (no group filtering)
      sql = `
        SELECT 
          c.id,
          c.name,
          c.parent_id,
          c.user_id,
          u.group_id,
          u.name as created_by_name,
          u.username as created_by_username,
          p.name as parent_name,
          (SELECT COUNT(*) FROM category c2 WHERE c2.parent_id = c.id) as child_count
        FROM category c
        LEFT JOIN category p ON c.parent_id = p.id
        INNER JOIN user u ON c.user_id = u.id
        ORDER BY c.parent_id, c.id
      `;
    } else {
      // Get all categories with their parent info (filtered by group)
      sql = `
        SELECT 
          c.id,
          c.name,
          c.parent_id,
          c.user_id,
          u.group_id,
          u.name as created_by_name,
          u.username as created_by_username,
          p.name as parent_name,
          (SELECT COUNT(*) FROM category c2 
           INNER JOIN user u2 ON c2.user_id = u2.id 
           INNER JOIN user cu2 ON cu2.group_id = u2.group_id 
           WHERE c2.parent_id = c.id AND cu2.id = :current_user_id) as child_count
        FROM category c
        LEFT JOIN category p ON c.parent_id = p.id
        INNER JOIN user u ON c.user_id = u.id
        INNER JOIN user cu ON cu.group_id = u.group_id
        WHERE cu.id = :current_user_id
        ORDER BY c.parent_id, c.id
      `;
      params.current_user_id = req.current_id;
    }

    const [allCategories] = await db.query(sql, params);

    // Group by parent_id for better visualization
    const structure = {};
    const groupInfo = allCategories.length > 0 ? {
      group_id: allCategories[0].group_id,
      sample_user: allCategories[0].created_by_name
    } : null;

    allCategories.forEach(cat => {
      const parentKey = cat.parent_id || 'ROOT';
      if (!structure[parentKey]) {
        structure[parentKey] = [];
      }
      structure[parentKey].push({
        id: cat.id,
        name: cat.name,
        child_count: cat.child_count,
        created_by: cat.created_by_name
      });
    });

    res.json({
      current_user_id: req.current_id,
      group_info: groupInfo,
      total_categories: allCategories.length,
      category_structure: structure,
      all_categories: allCategories,
      is_super_admin: isSuperAdmin,
      debug: {
        sql_used: isSuperAdmin ? "No group filtering (Super Admin)" : "Filtered by current user's group",
        group_filter_applied: !isSuperAdmin,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (error) {
    logError("category.debugCategoryStructure", error, res);
  }
};
exports.create = async (req, res) => {
  try {
    let parentId = 0;
    if (req.body.parent_id) {
      const numericParentId = Number(req.body.parent_id);
      if (!isNaN(numericParentId) && isFinite(numericParentId)) {
        parentId = numericParentId;
      }
    }

    const sql = `
      INSERT INTO category (name, description, status, parent_id, icon, user_id, company_id) 
      VALUES (:name, :description, :status, :parent_id, :icon, :user_id, :company_id)
    `;

    const [data] = await db.query(sql, {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      parent_id: parentId,
      icon: req.body.icon || null,
      user_id: req.current_id,
      company_id: req.company_id
    });

    res.json({
      data: data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("category.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    let parentId = 0;
    if (req.body.parent_id) {
      const numericParentId = Number(req.body.parent_id);
      if (!isNaN(numericParentId) && isFinite(numericParentId)) {
        parentId = numericParentId;
      }
    }

    const sql = `
      UPDATE category 
      SET name = :name, description = :description, status = :status, parent_id = :parent_id, icon = :icon
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      id: req.body.id,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      parent_id: parentId,
      icon: req.body.icon || null,
    });

    res.json({
      data: data,
      message: "Data update success!",
    });
  } catch (error) {
    logError("update.category", error, res);
  }
};
exports.remove = async (req, res) => {
  try {
    const [children] = await db.query(
      "SELECT COUNT(*) as count FROM category WHERE parent_id = :id",
      { id: req.body.id }
    );

    if (children[0].count > 0) {
      return res.status(400).json({
        error: true,
        message: "Cannot delete category that has subcategories!",
      });
    }

    const [data] = await db.query("DELETE FROM category WHERE id = :id", {
      id: req.body.id,
    });

    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("remove.category", error, res);
  }
};

// FIXED: Get stats for parent categories only
exports.getStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.icon,
        COUNT(c.id) as item_count
      FROM category p
      LEFT JOIN category c ON p.id = c.parent_id
      WHERE p.id NOT IN (
        SELECT DISTINCT parent_id 
        FROM category 
        WHERE parent_id IS NOT NULL
      )
      GROUP BY p.id, p.name, p.icon
      ORDER BY p.id
    `);

    res.json({
      stats: stats,
    });
  } catch (error) {
    logError("category.getStats", error, res);
  }
};