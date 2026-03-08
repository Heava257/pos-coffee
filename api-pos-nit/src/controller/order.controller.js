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

        // A. Insert into Orders Table (Dynamic to handle null user_id)
        const fields = ["business_id", "branch_id", "customer_name", "table_no", "sub_total", "total_amount", "payment_method", "order_type", "status"];
        const values = [business_id, branch_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, order_status];

        if (user_id) {
            fields.push("user_id");
            values.push(user_id);
        }

        const placeholders = values.map(() => "?").join(", ");
        const [order_res] = await conn.query(
            `INSERT INTO orders (${fields.join(", ")}) VALUES (${placeholders})`,
            values
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
                "SELECT raw_material_id, quantity FROM recipes WHERE product_id = ?",
                [item.product_id]
            );

            if (recipe.length > 0) {
                // Deduct materials
                for (const ingredient of recipe) {
                    await conn.query(
                        "UPDATE raw_materials SET quantity = quantity - ? WHERE id = ?",
                        [ingredient.quantity * item.qty, ingredient.raw_material_id]
                    );
                }
            } else {
                // If no recipe, assume product itself is tracked as stock item (simple inventory)
                // Check if product is set to track stock
                const [product] = await conn.query("SELECT is_track_stock FROM products WHERE id = ?", [item.product_id]);
                if (product.length > 0 && product[0].is_track_stock) {
                    // Logic for simple stock deduction could be here
                }
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

// 2. Get Order History (SaaS Scope)
exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id, user_id: session_user_id } = req;
        let { from_date, to_date, user_id, txtSearch } = req.query;

        // Scoping: 
        // 1. Admin/Owner can see all orders in business or filter by branch
        // 2. Regular staff can only see their branch orders
        let params = [business_id];
        let sql = `
            SELECT 
                o.*, 
                u.name as staff_name, 
                b.name as branch_name,
                (SELECT GROUP_CONCAT(p.name SEPARATOR ', ') FROM order_details od JOIN products p ON od.product_id = p.id WHERE od.order_id = o.id) as product_names,
                (SELECT SUM(qty) FROM order_details WHERE order_id = o.id) as total_quantity
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.business_id = ? 
        `;

        if (branch_id) {
            sql += " AND o.branch_id = ? ";
            params.push(branch_id);
        }

        if (user_id) {
            sql += " AND o.user_id = ? ";
            params.push(user_id);
        }

        if (from_date && to_date) {
            sql += " AND DATE(o.created_at) BETWEEN ? AND ? ";
            params.push(from_date, to_date);
        }

        if (txtSearch) {
            sql += " AND (o.order_no LIKE ? OR o.customer_name LIKE ?) ";
            params.push(`%${txtSearch}%`, `%${txtSearch}%`);
        }

        sql += " AND o.status != 'cancelled' ";
        sql += " ORDER BY o.id DESC LIMIT 100 ";

        const [list] = await db.query(sql, params);

        // Summary calculations
        const [sum] = await db.query(
            `SELECT COUNT(id) as total_order, SUM(total_amount) as total_amount FROM orders 
             WHERE business_id = ? ${branch_id ? 'AND branch_id = ?' : ''} AND status != 'cancelled'
             ${from_date && to_date ? 'AND DATE(created_at) BETWEEN ? AND ?' : ''}`,
            [business_id, ...(branch_id ? [branch_id] : []), ...(from_date && to_date ? [from_date, to_date] : [])]
        );

        res.json({
            list,
            summary: sum[0] || { total_order: 0, total_amount: 0 }
        });
    } catch (error) {
        logError("order.getList", error, res);
    }
};

// 3. Get Order Details
exports.getOrderDetail = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { business_id } = req;

        const [list] = await db.query(
            `SELECT od.*, p.name as product_name, p.image, c.name as category_name
             FROM order_details od
             LEFT JOIN products p ON od.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             JOIN orders o ON od.order_id = o.id
             WHERE od.order_id = ? AND o.business_id = ?`,
            [order_id, business_id]
        );

        const [order] = await db.query("SELECT * FROM orders WHERE id = ? AND business_id = ?", [order_id, business_id]);

        res.json({
            list,
            order: order[0]
        });
    } catch (error) {
        logError("order.getOrderDetail", error, res);
    }
};

// 4. Get Pending Orders (Dine In)
exports.getPendingOrders = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const [list] = await db.query(
            "SELECT * FROM orders WHERE business_id = ? AND branch_id = ? AND status = 'unpaid' AND order_type = 'dine_in' ORDER BY id DESC",
            [business_id, branch_id]
        );
        res.json({ list });
    } catch (error) {
        logError("order.getPendingOrders", error, res);
    }
};

// 5. Update Status
exports.updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        const { business_id } = req;
        await db.query("UPDATE orders SET status = ? WHERE id = ? AND business_id = ?", [status, id, business_id]);
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        logError("order.updateStatus", error, res);
    }
};
