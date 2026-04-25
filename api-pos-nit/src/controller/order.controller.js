const { db, logError } = require("../util/helper");

// 1. Create New Order (The Core Sale Point)
exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const user_id = req.user_id || null; 
        const {
            customer_name,
            table_no,
            sub_total,
            total_amount,
            total_paid,
            payment_method,
            order_type,
            cart_items,
            shift_id,
            status: requestStatus
        } = req.body;

        console.log("Creating new order:", {
            business_id, branch_id, user_id, customer_name, table_no, total_amount, total_paid, itemsCount: cart_items?.length, shift_id
        });

        // Default status: if guest ordered without paying yet -> 'ordered' or 'unpaid'
        // If POS staff created it (user_id exists) -> usually 'completed' (already paid)
        let order_status = requestStatus || (user_id ? 'completed' : 'ordered');
        if (payment_method === 'Cash' && !user_id) order_status = 'unpaid';

        // A. Insert into Orders Table (Dynamic to handle null user_id/shift_id)
        const fields = ["business_id", "branch_id", "customer_name", "table_no", "sub_total", "total_amount", "total_paid", "payment_method", "order_type", "status", "kitchen_status"];
        const values = [
            business_id, 
            branch_id, 
            customer_name, 
            table_no, 
            (Number(sub_total) || 0), 
            (Number(total_amount) || 0), 
            (Number(total_paid || total_amount) || 0), 
            payment_method, 
            order_type, 
            order_status, 
            'pending'
        ];

        if (user_id) {
            fields.push("user_id");
            values.push(user_id);
        }
        if (shift_id) {
            fields.push("shift_id");
            values.push(shift_id);
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
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.qty) || 1;
            await conn.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note) VALUES (?, ?, ?, ?, ?)",
                [order_id, item.product_id, itemQty, itemPrice, item.note || ""]
            );

            // 2. 🚀 AUTOMATED STOCK DEDUCTION (Recipe, Add-on, Size, & Waste Aware)
            const deductStock = async (productId, qtyMultiplier, itemName, sizeLabel = null) => {
                const [recipe] = await conn.query(
                    "SELECT raw_material_id, qty as quantity, waste_factor FROM recipe_detail WHERE product_id = ? AND business_id = ? AND (size_label = ? OR size_label IS NULL OR size_label = '')",
                    [productId, business_id, sizeLabel]
                );

                if (recipe.length > 0) {
                    // A. RECIPE-BASED DEDUCTION (e.g. Coffee Beans, Milk)
                    for (const ingredient of recipe) {
                        const baseQty = ingredient.quantity * qtyMultiplier;
                        const waste = ingredient.waste_factor || 0;
                        const deductQty = baseQty * (1 + waste / 100);

                        const [rm] = await conn.query("SELECT name, qty FROM raw_material WHERE id = ?", [ingredient.raw_material_id]);
                        const old_qty = rm[0]?.qty || 0;
                        const new_qty = old_qty - deductQty;

                        await conn.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [deductQty, ingredient.raw_material_id]);
                        await conn.query(`
                            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                            VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'sale', ?, ?, ?)
                        `, [business_id, branch_id, ingredient.raw_material_id, old_qty, new_qty, -deductQty, `ORD-${order_id}`, `Sale: ${itemName}${sizeLabel?' ('+sizeLabel+')':''}`, user_id]);
                    }
                } else {
                    // B. DIRECT PRODUCT DEDUCTION (e.g. Bottled Water, Cake)
                    const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [productId, branch_id]);
                    const old_qty = bp[0]?.stock_qty || 0;
                    const new_qty = old_qty - qtyMultiplier;

                    await conn.query(
                        "UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?",
                        [qtyMultiplier, productId, branch_id]
                    );

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'product', ?, ?, ?, ?, 'sale', ?, ?, ?)
                    `, [business_id, branch_id, productId, old_qty, new_qty, -qtyMultiplier, `ORD-${order_id}`, `Sale: ${itemName}`, user_id]);
                }
            };

            // Deduct Main Product
            const sizeLabel = item.options?.size || null;
            await deductStock(item.product_id, itemQty, item.note || 'Regular', sizeLabel);

            // 🌟 Deduct Add-ons (Starbucks Model: each addon can have its own recipe)
            if (item.options && item.options.addons && Array.isArray(item.options.addons)) {
                for (const addonName of item.options.addons) {
                    const [addonProducts] = await conn.query("SELECT id FROM products WHERE name = ? AND business_id = ?", [addonName, business_id]);
                    if (addonProducts.length > 0) {
                        await deductStock(addonProducts[0].id, itemQty, `Addon: ${addonName}`);
                    }
                }
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Order Placed Successfully!", order_id });

        // --- ASYNC TELEGRAM NOTIFICATION ---
        try {
            const { sendTelegramMessage } = require("../util/helper");
            const itemsText = cart_items.map(item => `• ${item.qty} x ${item.name}${item.options?.size ? ` (${item.options.size})` : ""}`).join("\n");
            const msg = `🧾 <b>NEW ORDER #${order_id}</b>\n` +
                        `--------------------------\n` +
                        `👤 <b>Customer:</b> ${customer_name || 'Guest'}\n` +
                        `📍 <b>Type:</b> ${order_type === 'dine_in' ? `Table ${table_no}` : 'Take Away'}\n` +
                        `💵 <b>Total:</b> $${Number(total_amount).toFixed(2)}\n` +
                        `💳 <b>Payment:</b> ${payment_method}\n` +
                        `--------------------------\n` +
                        `🛒 <b>ITEMS:</b>\n${itemsText}\n` +
                        `--------------------------\n` +
                        `📅 ${new Date().toLocaleString()}`;
            const keyboard = {
                inline_keyboard: [
                  [
                    { text: "📊 Today Sales", callback_data: "report_today_sale" },
                    { text: "💸 Today Expense", callback_data: "report_today_expense" }
                  ],
                  [
                    { text: "⚠️ Stock Alert", callback_data: "report_stock_alert" }
                  ]
                ]
            };
            sendTelegramMessage(business_id, msg, [], keyboard);
        } catch (tgErr) {
            console.error("Telegram Notification Fail:", tgErr.message);
        }

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
        let { from_date, to_date, user_id, txtSearch, shift_id } = req.query;

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

        if (shift_id) {
            sql += " AND o.shift_id = ? ";
            params.push(shift_id);
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

        // Detailed Summary: Total, Qty, and Breakdown by Payment Method
        const summaryParams = [
            business_id, 
            ...(branch_id ? [branch_id] : []), 
            ...(user_id ? [user_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : []),
            business_id, 
            ...(branch_id ? [branch_id] : []), 
            ...(user_id ? [user_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : [])
        ];

        const [sum] = await db.query(
            `SELECT 
                COUNT(o.id) as total_order, 
                SUM(o.total_amount) as total_amount,
                SUM(CASE WHEN o.payment_method = 'Cash' THEN o.total_amount ELSE 0 END) as total_cash,
                SUM(CASE WHEN o.payment_method = 'ABA' THEN o.total_amount ELSE 0 END) as total_aba,
                SUM(CASE WHEN o.payment_method = 'Wing' THEN o.total_amount ELSE 0 END) as total_wing,
                SUM(CASE WHEN o.payment_method NOT IN ('Cash', 'ABA', 'Wing') THEN o.total_amount ELSE 0 END) as total_other,
                (SELECT SUM(qty) FROM order_details od JOIN orders o2 ON od.order_id = o2.id 
                 WHERE o2.business_id = ? 
                 ${branch_id ? 'AND o2.branch_id = ?' : ''} 
                 ${user_id ? 'AND o2.user_id = ?' : ''}
                 AND o2.status != 'cancelled'
                 ${from_date && to_date ? 'AND DATE(o2.created_at) BETWEEN ? AND ?' : ''}
                ) as total_qty
             FROM orders o
             WHERE o.business_id = ? 
             ${branch_id ? 'AND o.branch_id = ?' : ''} 
             ${user_id ? 'AND o.user_id = ?' : ''}
             AND o.status != 'cancelled'
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}`,
            summaryParams
        );

        // Fetch Expenses for the same period and scope
        const expenseParams = [
            business_id,
            ...(branch_id ? [branch_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : [])
        ];
        const [expenses] = await db.query(
            `SELECT 
                SUM(amount) as total_expense,
                SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) as total_cash_expense
             FROM expense
             WHERE business_id = ? 
             ${branch_id ? 'AND branch_id = ?' : ''} 
             ${from_date && to_date ? 'AND DATE(expense_date) BETWEEN ? AND ?' : ''}`,
            expenseParams
        );

        // Fetch Top Selling Products
        const [topProducts] = await db.query(
            `SELECT p.name, SUM(od.qty) as total_qty
             FROM order_details od
             JOIN products p ON od.product_id = p.id
             JOIN orders o ON od.order_id = o.id
             WHERE o.business_id = ? 
             ${branch_id ? 'AND o.branch_id = ?' : ''} 
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}
             AND o.status != 'cancelled'
             GROUP BY p.id
             ORDER BY total_qty DESC
             LIMIT 5`,
            expenseParams // Same params as expenses (business_id, branch_id, date range)
        );

        res.json({
            list,
            summary: {
                ...(sum[0] || {}),
                total_expense: expenses[0]?.total_expense || 0,
                total_cash_expense: expenses[0]?.total_cash_expense || 0,
                top_products: topProducts
            }
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
        
        console.log("Fetching order details for ID:", order_id, "User Business ID:", business_id);

        const [order_check] = await db.query("SELECT id, business_id FROM orders WHERE id = ?", [order_id]);
        
        let order = [];
        if (business_id) {
            // Internal staff request (secure)
            const [rows] = await db.query("SELECT * FROM orders WHERE id = ? AND business_id = ?", [order_id, business_id]);
            order = rows;
        } else {
            // Public guest request
            const [rows] = await db.query("SELECT * FROM orders WHERE id = ?", [order_id]);
            order = rows;
        }

        if (order.length === 0) {
            console.log("Order access denied or not found:", { order_id, business_id });
            return res.json({
                details: [],
                order: null,
                message: "Order not found or access denied"
            });
        }

        const [list] = await db.query(
            `SELECT od.*, p.name as product_name, p.image, c.name as category_name
             FROM order_details od
             LEFT JOIN products p ON od.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE od.order_id = ?`,
            [order_id]
        );

        console.log("Order details successfully fetched. Count:", list.length);

        res.json({
            details: list,
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
        const { id, order_id, status } = req.body;
        const targetId = id || order_id;
        const { business_id } = req;
        await db.query("UPDATE orders SET status = ? WHERE id = ? AND business_id = ?", [status, targetId, business_id]);
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        logError("order.updateStatus", error, res);
    }
};

// 6. KDS (Kitchen Display System) - Get Active Orders
exports.getKDSOrders = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { is_history } = req.query;
 
        let sql = `
            SELECT 
                o.*, 
                u.name as staff_name,
                (SELECT GROUP_CONCAT(CONCAT(od.qty, ' x ', p.name) SEPARATOR '\n') 
                 FROM order_details od JOIN products p ON od.product_id = p.id 
                 WHERE od.order_id = o.id) as items_summary
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.business_id = ? AND o.branch_id = ? 
            AND o.status != 'cancelled'
            AND DATE(o.created_at) = CURDATE()
        `;

        if (is_history === '1' || is_history === 1 || is_history === 'true') {
            sql += " AND o.kitchen_status = 'served' ";
        } else {
            sql += " AND (o.kitchen_status IS NULL OR o.kitchen_status != 'served') ";
        }

        sql += " ORDER BY o.id ASC";

        const [list] = await db.query(sql, [business_id, branch_id]);
        res.json({ list });
    } catch (error) {
        logError("order.getKDSOrders", error, res);
    }
};

// 7. Update Kitchen Status
exports.updateKitchenStatus = async (req, res) => {
    try {
        const { id, kitchen_status } = req.body;
        const { business_id } = req;
        
        await db.query(
            "UPDATE orders SET kitchen_status = ? WHERE id = ? AND business_id = ?",
            [kitchen_status, id, business_id]
        );
        
        res.json({ success: true, message: "Kitchen status updated to " + kitchen_status });
    } catch (error) {
        logError("order.updateKitchenStatus", error, res);
    }
};

// 8. Public Web Order (For QR Ordering)
exports.createWebOrder = async (req, res) => {
    let connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            business_id,
            branch_id,
            customer_name,
            table_no,
            sub_total,
            total_amount,
            payment_method,
            order_type,
            cart_items,
            lat,
            lng,
            status // should be 'unpaid'
        } = req.body;

        if (!business_id || !branch_id) {
            return res.status(400).json({ message: "Missing Business or Branch context" });
        }

        // --- GPS VERIFICATION LOGIC ---
        let is_verified = 0;
        if (lat && lng) {
            const [branch] = await connection.query("SELECT lat, lng FROM branches WHERE id = ?", [branch_id]);
            if (branch.length > 0 && branch[0].lat && branch[0].lng) {
                // Calculate distance (Haversine formula)
                const R = 6371e3; // metres
                const φ1 = lat * Math.PI/180;
                const φ2 = branch[0].lat * Math.PI/180;
                const Δφ = (branch[0].lat - lat) * Math.PI/180;
                const Δλ = (branch[0].lng - lng) * Math.PI/180;
                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                          Math.cos(φ1) * Math.cos(φ2) *
                          Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c; // in metres
                
                if (distance <= 100) { // Verified if within 100 meters
                    is_verified = 1;
                }
            } else {
                // If branch has no lat/lng set, we trust the provided user GPS for now
                is_verified = 1;
            }
        }

        const [orderResult] = await connection.query(
            `INSERT INTO orders 
            (business_id, branch_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, status, kitchen_status, lat, lng, is_verified, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, NOW())`,
            [business_id, branch_id, customer_name || 'Web Guest', table_no, sub_total, total_amount, payment_method || 'Unpaid', order_type || 'dine_in', status || 'unpaid', lat, lng, is_verified]
        );

        const orderId = orderResult.insertId;

        for (const item of cart_items) {
            await connection.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note) VALUES (?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.qty, item.price, item.note]
            );
        }

        await connection.commit();
        res.json({ success: true, message: "Order Placed Successfully", order_id: orderId });
    } catch (error) {
        await connection.rollback();
        console.error("Web Order Error:", error);
        res.status(500).json({ message: "Order Processing Failed" });
    } finally {
        connection.release();
    }
};
// 9. Update Existing Order (Add items / Change totals)
exports.update = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const user_id = req.user_id || null;
        const {
            order_id,
            customer_name,
            table_no,
            sub_total,
            total_amount,
            total_paid,
            payment_method,
            order_type,
            cart_items,
            status,
            shift_id
        } = req.body;

        if (!order_id) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        console.log("Updating order:", { order_id, total_amount, itemsCount: cart_items?.length });

        // A. Update Main Order Record
        await conn.query(
            `UPDATE orders SET 
                customer_name = ?, table_no = ?, sub_total = ?, total_amount = ?, 
                total_paid = ?, payment_method = ?, order_type = ?, status = ?, 
                shift_id = COALESCE(?, shift_id)
             WHERE id = ? AND business_id = ?`,
            [customer_name, table_no, Number(sub_total), Number(total_amount), Number(total_paid), payment_method, order_type, status || 'completed', shift_id, order_id, business_id]
        );

        // B. Update Details & Stock
        // For simplicity and safety in this specific version: 
        // We fetch existing details, compare, and only insert/deduct for NEW items or increased quantities.
        // But the most common request is "I added items to a table".
        
        // 1. Get existing items for this order
        const [existingItems] = await conn.query("SELECT product_id, qty FROM order_details WHERE order_id = ?", [order_id]);
        
        for (const item of cart_items) {
            const existing = existingItems.find(ei => ei.product_id === item.product_id);
            const newQty = Number(item.qty) || 0;
            const oldQty = existing ? Number(existing.qty) : 0;
            const diffQty = newQty - oldQty;

            if (diffQty > 0) {
                // It's a new item or increased quantity -> Deduct Stock and Insert/Update Detail
                if (existing) {
                    await conn.query("UPDATE order_details SET qty = ?, price = ?, note = ? WHERE order_id = ? AND product_id = ?", 
                        [newQty, Number(item.price), item.note || "", order_id, item.product_id]);
                } else {
                    await conn.query("INSERT INTO order_details (order_id, product_id, qty, price, note) VALUES (?, ?, ?, ?, ?)",
                        [order_id, item.product_id, newQty, Number(item.price), item.note || ""]);
                }

                // 🚀 DEDUCT STOCK for the DIFFERENCE
                const deductStock = async (productId, qtyMultiplier, itemName, sizeLabel = null) => {
                    const [recipe] = await conn.query(
                        "SELECT raw_material_id, qty as quantity, waste_factor FROM recipe_detail WHERE product_id = ? AND business_id = ? AND (size_label = ? OR size_label IS NULL OR size_label = '')",
                        [productId, business_id, sizeLabel]
                    );

                    if (recipe.length > 0) {
                        for (const ingredient of recipe) {
                            const deductQty = (ingredient.quantity * qtyMultiplier) * (1 + (ingredient.waste_factor || 0) / 100);
                            await conn.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [deductQty, ingredient.raw_material_id]);
                        }
                    } else {
                        await conn.query("UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?", [qtyMultiplier, productId, branch_id]);
                    }
                };

                const sizeLabel = item.options?.size || null;
                await deductStock(item.product_id, diffQty, item.name || 'Update', sizeLabel);
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Order Updated Successfully!" });
    } catch (error) {
        await conn.rollback();
        logError("order.update", error, res);
    } finally {
        conn.release();
    }
};
