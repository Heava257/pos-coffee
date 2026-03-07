const { db, logError } = require("../util/helper");

// 1. Create New Order (The Core Sale Point)
exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const user_id = req.user_id || null; // Support guest orders (QR Scan)
        const {
            customer_name,
            table_no,
            sub_total,
            total_amount,
            payment_method,
            order_type,
            cart_items, // Array of products
            status: requestStatus // 'unpaid' etc.
        } = req.body;

        // Default status: if guest ordered without paying yet -> 'ordered' or 'unpaid'
        // If POS staff created it (user_id exists) -> usually 'completed' (already paid)
        let order_status = requestStatus || (user_id ? 'completed' : 'ordered');
        if (payment_method === 'Cash' && !user_id) order_status = 'unpaid';

        // A. Insert into Orders Table
        const [order_res] = await conn.query(
            `INSERT INTO orders (business_id, branch_id, user_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [business_id, branch_id, user_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, order_status]
        );
        const order_id = order_res.insertId;

        // B. Insert Details & Deduct Stock (Recipe Aware)
        for (const item of cart_items) {
            // 1. Insert Detail Record
            await conn.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note) VALUES (?, ?, ?, ?, ?)",
                [order_id, item.product_id, item.qty, item.price, item.note || ""]
            );

            // 2. Fetch Recipe if exists
            const [recipe] = await conn.query(
                "SELECT raw_material_id, qty FROM recipe_detail WHERE product_id = ?",
                [item.product_id]
            );

            if (recipe && recipe.length > 0) {
                // CASE A: Deduced via Ingredients
                for (const ing of recipe) {
                    const totalDeduct = ing.qty * item.qty;

                    // Fetch current RM stock for logging
                    const [rmData] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [ing.raw_material_id]);
                    const old_qty = rmData[0]?.qty || 0;
                    const new_qty = old_qty - totalDeduct;

                    // Update RM stock
                    await conn.query(
                        "UPDATE raw_material SET qty = qty - ? WHERE id = ?",
                        [totalDeduct, ing.raw_material_id]
                    );

                    // LOG RM Movement
                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'sale', ?, 'POS Sale (Recipe)', ?)
                    `, [business_id, branch_id, ing.raw_material_id, old_qty, new_qty, -totalDeduct, `INV-${order_id}`, user_id]);
                }
            } else {
                // CASE B: Direct Product Stock (e.g. bottled drinks)
                const [bpData] = await conn.query(
                    "SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?",
                    [item.product_id, branch_id]
                );
                const old_qty = bpData[0]?.stock_qty || 0;
                const new_qty = old_qty - item.qty;

                await conn.query(
                    "UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?",
                    [item.qty, item.product_id, branch_id]
                );

                // LOG Product Movement
                await conn.query(`
                    INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                    VALUES (?, ?, 'product', ?, ?, ?, ?, 'sale', ?, 'POS Sale', ?)
                `, [business_id, branch_id, item.product_id, old_qty, new_qty, -item.qty, `INV-${order_id}`, user_id]);
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Order Placed Successfully!", order_id });

    } catch (error) {
        await conn.rollback();
        logError("order.create", error, res);
    } finally {
        conn.release();
    }
};

// 2. Get Order History (Branch Specific)
exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { from_date, to_date } = req.query;

        let params = [business_id, branch_id];
        let sql = `
            SELECT o.*, u.name as staff_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.business_id = ? AND o.branch_id = ?
        `;

        if (from_date && to_date) {
            sql += " AND DATE(o.created_at) BETWEEN ? AND ?";
            params.push(from_date, to_date);
        }

        sql += " AND o.status != 'cancelled'";
        sql += " ORDER BY o.id DESC LIMIT 100";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("order.getList", error, res);
    }
};

// 3. Get Order Details
exports.getOrderDetail = async (req, res) => {
    try {
        const { order_id } = req.params;
        const sql = `
            SELECT od.*, p.name as product_name, p.image
            FROM order_details od
            INNER JOIN products p ON od.product_id = p.id
            WHERE od.order_id = ?
        `;
        const [details] = await db.query(sql, [order_id]);
        res.json({ details });
    } catch (error) {
        logError("order.getOrderDetail", error, res);
    }
};

// 4. Get Pending Orders (For POS Table ordering)
exports.getPendingOrders = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const sql = `
            SELECT o.* 
            FROM orders o
            WHERE o.business_id = ? AND o.branch_id = ? AND o.status IN ('ordered', 'unpaid')
            ORDER BY o.id DESC
        `;
        const [list] = await db.query(sql, [business_id, branch_id]);
        res.json({ list });
    } catch (error) {
        logError("order.getPendingOrders", error, res);
    }
};

// 5. Update Order Status (e.g. from table ordering to paid)
exports.updateStatus = async (req, res) => {
    try {
        const { order_id, status, payment_method } = req.body;
        const { business_id } = req;

        // Verify ownership
        const [order] = await db.query("SELECT id FROM orders WHERE id = ? AND business_id = ?", [order_id, business_id]);
        if (order.length === 0) return res.status(403).json({ message: "Order not found" });

        const sql = "UPDATE orders SET status = ?, payment_method = ? WHERE id = ?";
        await db.query(sql, [status || 'completed', payment_method || 'Cash', order_id]);

        res.json({ success: true, message: "Order status updated successfully!" });
    } catch (error) {
        logError("order.updateStatus", error, res);
    }
};
