const {
  db,
  isArray,
  isEmpty,
  logError,
  removeFile,
} = require("../util/helper");

exports.getSizes = async (req, res) => {
  try {
    const { product_id } = req.query;
    let sql = "SELECT * FROM product_size";
    let params = [];

    if (product_id) {
      sql += " WHERE product_id = ?";
      params.push(product_id);
    }

    sql += " ORDER BY id ASC";
    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("product.getSizes", error, res);
  }
};




exports.getAddons = async (req, res) => {
  try {
    const { product_id } = req.query;
    let sql = "SELECT * FROM product_addon";
    let params = [];

    if (product_id) {
      sql += " WHERE product_id = ?";
      params.push(product_id);
    }

    sql += " ORDER BY id ASC";
    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("product.getAddons", error, res);
  }
};

exports.getList = async (req, res) => {
  try {
    const { txt_search, category_id, parent_id } = req.query;
    let params = {};
    let sql;

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;
    const company_id = req.auth?.company_id;

    if (isSuperAdmin) {
      // Super admin can see all products
      sql = `
        SELECT 
          p.*, 
          c.name AS category_name,
          c.parent_id,
          parent_cat.name AS parent_category_name,
          u.group_id,
          u.name as created_by_name,
          u.username as created_by_username
        FROM product p
        INNER JOIN category c ON p.category_id = c.id
        LEFT JOIN category parent_cat ON c.parent_id = parent_cat.id
        INNER JOIN user u ON p.user_id = u.id
        WHERE p.status = 1
      `;
    } else {
      // Regular users see products from their COMPANY (Multi-tenant isolation)
      sql = `
        SELECT 
          p.*, 
          c.name AS category_name,
          c.parent_id,
          parent_cat.name AS parent_category_name,
          u.group_id,
          u.name as created_by_name,
          u.username as created_by_username
        FROM product p
        INNER JOIN category c ON p.category_id = c.id
        LEFT JOIN category parent_cat ON c.parent_id = parent_cat.id
        INNER JOIN user u ON p.user_id = u.id
        WHERE p.status = 1 
        AND p.company_id = :company_id
      `;
      params.company_id = company_id;
    }

    // Search by name or barcode
    if (txt_search) {
      sql += " AND (p.name LIKE :txt_search OR p.barcode = :barcode)";
      params.txt_search = `%${txt_search}%`;
      params.barcode = txt_search;
    }

    // Handle parent_id filtering
    if (parent_id && parent_id !== "all") {
      const parentId = Number(parent_id);
      if (!isNaN(parentId)) {
        sql += " AND c.parent_id = :parent_id";
        params.parent_id = parentId;
      }
    }

    // Filter by specific category (legacy support)
    if (category_id && category_id !== "all") {
      const catId = Number(category_id);
      if (!isNaN(catId)) {
        sql += " AND p.category_id = :cat_id";
        params.cat_id = catId;
      }
    }

    sql += " ORDER BY p.id DESC";

    const [products] = await db.query(sql, params);

    // Get parent categories - super admin sees all, regular users see group-filtered
    let parentCategoriesSql;
    let parentCategoriesParams = {};

    if (isSuperAdmin) {
      parentCategoriesSql = `
        SELECT DISTINCT c.* 
        FROM category c
        WHERE c.id IN (
          SELECT DISTINCT parent_id 
          FROM category 
          WHERE parent_id IS NOT NULL
        )
        ORDER BY c.id ASC
      `;
    } else {
      parentCategoriesSql = `
        SELECT DISTINCT c.* 
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
      parentCategoriesParams.current_user_id = req.current_id;
    }

    const [allParentCategories] = await db.query(parentCategoriesSql, parentCategoriesParams);

    res.json({
      list: products,
      all_parent_categories: allParentCategories,
      is_super_admin: isSuperAdmin,
      debug: {
        sql_used: sql,
        params_used: params,
        total: products.length,
        total_parent_categories: allParentCategories.length,
        parent_id_filter: parent_id,
        category_id_filter: category_id,
        current_user_id: req.current_id,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (error) {
    console.error("❌ getList error:", error);
    logError("product.getList", error, res);
  }
};

exports.create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const barcodeExists = await isExistBarcode(req.body.barcode);
    if (barcodeExists) {
      return res.status(400).json({ error: { barcode: "Barcode already exists." } });
    }

    const sql = `
  INSERT INTO product 
    (category_id, barcode, name, brand, description, qty, price, discount, status, image, create_by, user_id, company_id, product_type) 
  VALUES 
    (:category_id, :barcode, :name, :brand, :description, :qty, :price, :discount, :status, :image, :create_by, :user_id, :company_id, :product_type)
`;


    // Help sanitize "undefined" strings from multipart/form-data
    const body = { ...req.body };
    Object.keys(body).forEach(key => {
      if (body[key] === "undefined" || body[key] === "null") {
        body[key] = null;
      }
    });

    const [result] = await connection.query(sql, {
      ...body,
      discount: body.discount || 0,
      price: body.price || 0,
      qty: body.qty || 0,
      status: body.status || 1,
      image: req.file?.filename || null,
      create_by: req.auth?.name || "System",
      user_id: req.auth?.id || null,
      company_id: req.auth?.company_id,
      product_type: body.product_type || 'ready'
    });

    const product_id = result.insertId;

    // Save sizes
    const sizes = JSON.parse(req.body.sizes || "[]");
    for (const size of sizes) {
      await connection.query(
        `INSERT INTO product_size (product_id, label, price) VALUES (?, ?, ?)`,
        [product_id, size.label, size.price]
      );
    }

    // Save addons
    const addons = JSON.parse(req.body.addons || "[]");
    for (const addon of addons) {
      await connection.query(
        `INSERT INTO product_addon (product_id, label, price) VALUES (?, ?, ?)`,
        [product_id, addon.label, addon.price]
      );
    }

    await connection.commit();
    res.json({ message: "Product created successfully!", product_id });
  } catch (error) {
    await connection.rollback();
    logError("product.create", error, res);
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let filename = req.body.image;
    if (req.file) filename = req.file.filename;
    if (req.body.image_remove === "1") {
      removeFile(req.body.image);
      filename = null;
    }

    const updateSql = `
      UPDATE product SET
        category_id = :category_id,
        barcode = :barcode,
        name = :name,
        brand = :brand,
        description = :description,
        qty = :qty,
        price = :price,
        discount = :discount,
        status = :status,
        image = :image,
        product_type = :product_type
      WHERE id = :id
    `;
    await connection.query(updateSql, {
      ...req.body,
      image: filename,
      product_type: req.body.product_type || "ready",
    });

    let sizes = [];
    let addons = [];

    // 🔄 Update sizes
    try {
      sizes = JSON.parse(req.body.sizes || "[]");
    } catch (e) {
      sizes = [];
    }

    await connection.query(`DELETE FROM product_size WHERE product_id = ?`, [req.body.id]);
    for (const size of sizes) {
      await connection.query(
        `INSERT INTO product_size (product_id, label, price) VALUES (?, ?, ?)`,
        [req.body.id, size.label, size.price]
      );
    }

    // 🔄 Update addons
    try {
      addons = JSON.parse(req.body.addons || "[]");
    } catch (e) {
      addons = [];
    }
    await connection.query(`DELETE FROM product_addon WHERE product_id = ?`, [req.body.id]);
    for (const addon of addons) {
      await connection.query(
        `INSERT INTO product_addon (product_id, label, price) VALUES (?, ?, ?)`,
        [req.body.id, addon.label, addon.price]
      );
    }

    await connection.commit();
    res.json({ message: "Product updated successfully!" });
  } catch (error) {
    await connection.rollback();
    logError("product.update", error, res);
  } finally {
    connection.release();
  }
};


exports.remove = async (req, res) => {
  try {
    var [data] = await db.query("DELETE FROM product WHERE id = :id", {
      id: req.body.id, // null
    });
    if (data.affectedRows && req.body.image != "" && req.body.image != null) {
      removeFile(req.body.image);
    }
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("remove.create", error, res);
  }
};

exports.newBarcode = async (req, res) => {
  try {
    let barcode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate a more complex barcode that includes timestamp
      const timestampPart = Date.now().toString().slice(-4);
      const randomPart = Math.floor(100 + Math.random() * 900); // 3-digit random number
      barcode = `P${timestampPart}${randomPart}`;

      // Check if barcode exists
      const sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
      const [data] = await db.query(sql, { barcode });

      if (data.length > 0 && data[0].Total === 0) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      // Fallback to original method if unique not found
      const sql = "SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode";
      const [data] = await db.query(sql);
      barcode = data[0].barcode;
    }

    res.json({ barcode });
  } catch (error) {
    logError("remove.create", error, res);
  }
};
isExistBarcode = async (barcode) => {
  try {
    var sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
    var [data] = await db.query(sql, {
      barcode: barcode,
    });
    if (data.length > 0 && data[0].Total > 0) {
      return true; // ស្ទួន
    }
    return false; // អត់ស្ទួនទេ
  } catch (error) {
    logError("remove.create", error, res);
  }
};

exports.checkBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
    const [data] = await db.query(sql, { barcode });

    res.json({
      exists: data.length > 0 && data[0].Total > 0
    });
  } catch (error) {
    logError("product.checkBarcode", error, res);
  }
};