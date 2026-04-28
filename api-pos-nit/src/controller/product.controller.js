const { db, logError, removeFile, checkPlanLimit } = require("../util/helper");
const { getCache, setCache, clearCache } = require("../util/redisClient");

const cleanVal = (val) => {
    if (val === "undefined" || val === "null" || val === undefined || val === null || val === "") return null;
    return val;
};

// 1. Get Product List for POS (Active & Branch Filtered)
exports.getList = async (req, res) => {
    try {
        const { txt_search, category_id, is_list_all } = req.query;
        const business_id = req.business_id || req.query.business_id;
        const branch_id = req.branch_id || req.query.branch_id;

        if (!business_id || !branch_id) return res.json({ list: [] });

        const cacheKey = txt_search ? null : `products_biz_${business_id}_branch_${branch_id}_cat_${category_id || 'all'}_all_${is_list_all || 0}`;

        if (cacheKey) {
            const cachedData = await getCache(cacheKey);
            if (cachedData) {
                return res.json({ list: cachedData, source: "redis" });
            }
        }

        let params = [business_id];
        let sql = `
        SELECT 
            p.id, p.name, p.image, p.category_id, p.status, p.barcode, p.brand, p.description,
            p.sizes, p.addons, p.moods, p.discount, p.product_type,
            p.expiry_date, p.strength, p.generic_name,
            bp.price, bp.cost_price, bp.stock_qty AS qty, bp.is_available, bp.min_stock_alert,
            c.name as category_name,
            (SELECT EXISTS (
                SELECT 1 FROM recipe_detail rd 
                JOIN raw_material rm ON rd.raw_material_id = rm.id 
                WHERE rd.product_id = p.id AND rd.business_id = p.business_id AND rm.qty < rd.qty
            )) as is_recipe_oos,
            (SELECT MIN(FLOOR(rm.qty / rd.qty)) 
             FROM recipe_detail rd 
             JOIN raw_material rm ON rd.raw_material_id = rm.id 
             WHERE rd.product_id = p.id AND rd.business_id = p.business_id
            ) as estimated_servings
        FROM products p
        LEFT JOIN branch_products bp ON p.id = bp.product_id AND bp.branch_id = ?
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.business_id = ?
    `;

        // Add branch_id to params for the LEFT JOIN
        params.unshift(branch_id);

        if (!is_list_all) {
            sql += " AND bp.branch_id IS NOT NULL AND p.status = 1";
        }

        if (txt_search) {
            sql += " AND p.name LIKE ?";
            params.push(`%${txt_search}%`);
        }

        if (category_id && category_id !== "all" && category_id !== "null") {
            sql += " AND p.category_id = ?";
            params.push(category_id);
        }

        sql += " ORDER BY p.id DESC";

        const [list] = await db.query(sql, params);

        if (cacheKey) {
            await setCache(cacheKey, list, 3600); // 1 hour cache
        }

        res.json({ list });
    } catch (error) {
        logError("product.getList", error, res);
    }
};

exports.create = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const { 
            name, category_id, barcode, brand, price, cost_price, description, status, qty, 
            sizes, addons, moods, discount, min_stock_alert,
            expiry_date, strength, generic_name 
        } = req.body;
        const image = req.file?.path || req.file?.filename || null;

        // Optimized Subscription Limit Check
        const limitCheck = await checkPlanLimit(business_id, 'product');
        if (!limitCheck.allowed) {
          if (conn) await conn.rollback();
          return res.status(403).json({
            message: limitCheck.message,
            limit_reached: true
          });
        }

        // A. Insert into Global Products (Template)
        const [p_res] = await conn.query(
            "INSERT INTO products (business_id, category_id, barcode, brand, name, description, image, status, sizes, addons, moods, discount, expiry_date, strength, generic_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                Number(business_id),
                Number(cleanVal(category_id)),
                cleanVal(barcode),
                cleanVal(brand),
                name,
                cleanVal(description),
                image || null,
                Number(cleanVal(status) || 1),
                cleanVal(sizes),
                cleanVal(addons),
                cleanVal(moods),
                Number(cleanVal(discount) || 0),
                cleanVal(expiry_date),
                cleanVal(strength),
                cleanVal(generic_name)
            ]
        );
        const product_id = p_res.insertId;

        // B. Insert into Branch Inventory (The instance for current branch)
        await conn.query(
            "INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty, min_stock_alert) VALUES (?, ?, ?, ?, ?, ?)",
            [
                Number(branch_id),
                Number(product_id),
                (Number(price) || 0),
                (Number(cost_price) || 0),
                (Number(qty) || 0),
                (Number(min_stock_alert) || 5)
            ]
        );

        await conn.commit();
        await clearCache(`products_biz_${business_id}_branch_*`);
        await clearCache(`categories_biz_${business_id}`);
        res.json({ success: true, message: "Product created and added to branch!" });
    } catch (error) {
        if (conn) await conn.rollback();
        logError("product.create", error, res);
    } finally {
        if (conn) conn.release();
    }
};

// 3. Update Product details
exports.update = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const { 
            id, name, category_id, barcode, brand, price, cost_price, description, status, qty, 
            sizes, addons, moods, discount, min_stock_alert,
            expiry_date, strength, generic_name
        } = req.body;
        const { business_id, branch_id } = req;

        const image = req.file?.path || req.file?.filename;

        // Update Template
        let sql = `
            UPDATE products SET 
                name = ?, category_id = ?, barcode = ?, brand = ?, 
                description = ?, status = ?, sizes = ?, addons = ?, moods = ?, discount = ?,
                expiry_date = ?, strength = ?, generic_name = ?
        `;
        let params = [
            name,
            Number(cleanVal(category_id)),
            cleanVal(barcode),
            cleanVal(brand),
            cleanVal(description),
            Number(cleanVal(status) || 1),
            cleanVal(sizes),
            cleanVal(addons),
            cleanVal(moods),
            Number(cleanVal(discount) || 0),
            cleanVal(expiry_date),
            cleanVal(strength),
            cleanVal(generic_name)
        ];

        if (image) {
            sql += ", image = ?";
            params.push(image);
        }

        sql += " WHERE id = ? AND business_id = ?";
        params.push(Number(id), Number(business_id));

        await conn.query(sql, params);

        // Update Branch Specifics
        await conn.query(
            "UPDATE branch_products SET price = ?, cost_price = ?, stock_qty = ?, min_stock_alert = ? WHERE product_id = ? AND branch_id = ?",
            [
                (Number(cleanVal(price)) || 0),
                (Number(cleanVal(cost_price)) || 0),
                (Number(cleanVal(qty)) || 0),
                (Number(cleanVal(min_stock_alert)) || 5),
                Number(id),
                Number(branch_id)
            ]
        );

        await conn.commit();
        await clearCache(`products_biz_${business_id}_branch_*`);
        await clearCache(`categories_biz_${business_id}`);
        res.json({ success: true, message: "Product updated successfully!" });
    } catch (error) {
        if (conn) await conn.rollback();
        logError("product.update", error, res);
    } finally {
        if (conn) conn.release();
    }
};

// 4. Remove Product
exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        const { business_id } = req;

        // This will cascade delete from branch_products if foreign key is set correctly
        await db.query("DELETE FROM products WHERE id = ? AND business_id = ?", [id, business_id]);

        await clearCache(`products_biz_${business_id}_branch_*`);
        await clearCache(`categories_biz_${business_id}`);

        res.json({ message: "Product removed successfully!" });
    } catch (error) {
        logError("product.remove", error, res);
    }
};

// 5. Get Business-wide products (to add existing products to another branch)
exports.getBusinessProducts = async (req, res) => {
    try {
        const { business_id } = req;
        const { target_business_id } = req.query;

        // Super Admin can see any business's product catalog
        const bizId = (business_id === 1 && target_business_id) ? target_business_id : business_id;

        const sql = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.business_id = ?
        `;
        const [list] = await db.query(sql, [bizId]);
        res.json({ list });
    } catch (error) {
        logError("product.getBusinessProducts", error, res);
    }
}

// 6. Link existing product to branch
exports.linkToBranch = async (req, res) => {
    try {
        const { branch_id } = req;
        const { product_id, price, cost_price } = req.body;

        await db.query(
            "INSERT INTO branch_products (branch_id, product_id, price, cost_price) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE price=?, cost_price=?",
            [branch_id, product_id, price, cost_price, price, cost_price]
        );

        // We could extract business_id from req for clearing cache, assuming req.business_id exists.
        await clearCache(`products_biz_${req.business_id}_branch_${branch_id}_*`);
        if (req.business_id) await clearCache(`categories_biz_${req.business_id}`);

        res.json({ message: "Product linked to branch!" });
    } catch (error) {
        logError("product.linkToBranch", error, res);
    }
}

// 7. Generate New Barcode (Guaranteed Unique)
exports.generateBarcode = async (req, res) => {
    try {
        const { business_id } = req;
        let barcode = "";
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            // Generate random 8-digit
            barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
            
            // Check if exists
            const [rows] = await db.query(
                "SELECT id FROM products WHERE barcode = ? AND business_id = ?",
                [barcode, business_id]
            );
            
            if (rows.length === 0) {
                isUnique = true;
            }
            attempts++;
        }

        res.json({ barcode });
    } catch (error) {
        logError("product.generateBarcode", error, res);
    }
};

// 8. Check if Barcode Exists
exports.checkBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const { business_id } = req;
        const [rows] = await db.query(
            "SELECT id FROM products WHERE barcode = ? AND business_id = ?",
            [barcode, business_id]
        );
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        logError("product.checkBarcode", error, res);
    }
};
