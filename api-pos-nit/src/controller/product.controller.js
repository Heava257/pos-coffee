const { db, logError, removeFile } = require("../util/helper");

// 1. Get Product List for POS (Active & Branch Filtered)
exports.getList = async (req, res) => {
    try {
        const { txt_search, category_id, is_list_all } = req.query;
        const { business_id, branch_id } = req;

        let params = [business_id];
        let sql = `
        SELECT 
            p.id, p.name, p.image, p.category_id, p.status, p.barcode, p.brand,
            p.sizes, p.addons, p.discount,
            bp.price, bp.cost_price, bp.stock_qty AS qty, bp.is_available,
            c.name as category_name
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


        res.json({ list });
    } catch (error) {
        logError("product.getList", error, res);
    }
};

exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const { name, category_id, barcode, brand, price, cost_price, description, status, qty, sizes, addons, discount } = req.body;
        const image = req.file?.path || req.file?.filename || null;

        // Optimized Subscription Limit Check
        const { checkPlanLimit } = require("../util/helper");
        const limitCheck = await checkPlanLimit(business_id, 'product');
        if (!limitCheck.allowed) {
            return res.status(403).json({
                message: limitCheck.message,
                limit_reached: true
            });
        }

        // A. Insert into Global Products (Template)
        const [p_res] = await conn.query(
            "INSERT INTO products (business_id, category_id, barcode, brand, name, description, image, status, sizes, addons, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [business_id, category_id, barcode, brand || null, name, description || null, image, status || 1, sizes || null, addons || null, discount || 0]
        );
        const product_id = p_res.insertId;

        // B. Insert into Branch Inventory (The instance for current branch)
        await conn.query(
            "INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)",
            [branch_id, product_id, price, cost_price || 0, qty || 0]
        );

        await conn.commit();
        res.json({ success: true, message: "Product created and added to branch!" });
    } catch (error) {
        await conn.rollback();
        logError("product.create", error, res);
    } finally {
        conn.release();
    }
};

// 3. Update Product details
exports.update = async (req, res) => {
    try {
        const { id, name, category_id, barcode, brand, price, cost_price, description, status, qty, sizes, addons, discount } = req.body;
        const { business_id, branch_id } = req;

        const image = req.file?.path || req.file?.filename;
        const p_status = (status === 'undefined' || status === undefined) ? 1 : Number(status);
        const p_qty = (qty === 'undefined' || qty === undefined) ? 0 : Number(qty);

        // Update Template
        let sql = `
            UPDATE products SET 
                name = ?, category_id = ?, barcode = ?, brand = ?, 
                description = ?, status = ?, sizes = ?, addons = ?, discount = ?
        `;
        let params = [name, category_id, barcode, brand || null, description || null, p_status, sizes || null, addons || null, discount || 0];

        if (image) {
            sql += ", image = ?";
            params.push(image);
        }

        sql += " WHERE id = ? AND business_id = ?";
        params.push(id, business_id);

        await db.query(sql, params);

        // Update Branch Specifics
        await db.query(
            "UPDATE branch_products SET price = ?, cost_price = ?, stock_qty = ? WHERE product_id = ? AND branch_id = ?",
            [price, cost_price, p_qty, id, branch_id]
        );

        res.json({ success: true, message: "Product updated successfully!" });
    } catch (error) {
        logError("product.update", error, res);
    }
};

// 4. Remove Product
exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        const { business_id } = req;

        // This will cascade delete from branch_products if foreign key is set correctly
        await db.query("DELETE FROM products WHERE id = ? AND business_id = ?", [id, business_id]);

        res.json({ message: "Product removed successfully!" });
    } catch (error) {
        logError("product.remove", error, res);
    }
};

// 5. Get Business-wide products (to add existing products to another branch)
exports.getBusinessProducts = async (req, res) => {
    try {
        const { business_id } = req;
        const [list] = await db.query("SELECT * FROM products WHERE business_id = ?", [business_id]);
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

        res.json({ message: "Product linked to branch!" });
    } catch (error) {
        logError("product.linkToBranch", error, res);
    }
}

// 7. Generate New Barcode
exports.generateBarcode = async (req, res) => {
    try {
        // Generate a random 8-digit barcode
        const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
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
