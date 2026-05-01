const { db, logError } = require("../util/helper");

// Helper: Deduct Stock
const deductStock = async (conn, productId, qtyMultiplier, business_id, branch_id, plan_id = 0) => {
    try {
        // 🚀 PLAN-BASED LOGIC: Only check for recipes if plan is Advanced (ID >= 6)
        let recipe = [];
        if (plan_id >= 6) {
            const [rows] = await conn.query(
                "SELECT raw_material_id, qty as quantity, waste_factor FROM recipe_detail WHERE product_id = ? AND business_id = ?",
                [productId, business_id]
            );
            recipe = rows;
        }

        if (recipe.length > 0) {
            for (const ingredient of recipe) {
                const deductQty = (ingredient.quantity * qtyMultiplier) * (1 + (ingredient.waste_factor || 0) / 100);
                await conn.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [deductQty, ingredient.raw_material_id]);
            }
        } else {
            // Default: Deduct from branch_products if no recipe exists or plan is not advanced
            await conn.query(
                "UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?",
                [qtyMultiplier, productId, branch_id]
            );
        }
    } catch (e) {
        console.error("Stock Deduction Error:", e);
    }
};
exports.deductStock = deductStock;

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
            customer_id,
            guest_count,
            status: requestStatus
        } = req.body;

        console.log("Creating new order:", {
            business_id, branch_id, user_id, customer_name, table_no, total_amount, total_paid, itemsCount: cart_items?.length, shift_id, guest_count
        });

        // Default status: if guest ordered without paying yet -> 'unpaid'
        // If POS staff created it and paid -> 'completed'
        let order_status = requestStatus || (payment_method ? 'completed' : 'unpaid');

        // AUTO-MERGE: Check if table already has an unpaid order
        if (table_no && order_type === 'dine_in') {
            const [existingOrders] = await conn.query(
                "SELECT id FROM orders WHERE table_no = ? AND branch_id = ? AND status = 'unpaid' ORDER BY id DESC LIMIT 1",
                [table_no, branch_id]
            );
            if (existingOrders.length > 0) {
                console.log(`[Auto-Merge] Found existing unpaid order ${existingOrders[0].id} for table ${table_no}. Redirecting to additive update...`);
                req.body.order_id = existingOrders[0].id;
                req.body.is_additive = true; // 🚀 IMPORTANT: Don't delete existing items!
                await conn.release();
                return exports.update(req, res);
            }
        }

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
            req.body.kitchen_status || 'pending',
            Number(guest_count) || 1
        ];

        const fields = ["business_id", "branch_id", "customer_name", "table_no", "sub_total", "total_amount", "total_paid", "payment_method", "order_type", "status", "kitchen_status", "guest_count"];

        if (user_id) {
            fields.push("user_id");
            values.push(user_id);
        }
        if (shift_id) {
            fields.push("shift_id");
            values.push(shift_id);
        }
        if (customer_id) {
            fields.push("customer_id");
            values.push(customer_id);
        }

        const placeholders = values.map(() => "?").join(", ");
        const [order_res] = await conn.query(
            `INSERT INTO orders (${fields.join(", ")}) VALUES (${placeholders})`,
            values
        );
        const order_id = order_res.insertId;

        // C. AUTO-CLEAR PENDING WEB ORDERS for this table
        if (table_no) {
            console.log(`[Auto-Clear Create] Table: ${table_no}, Biz: ${business_id}, Skip ID: ${order_id}`);
            const [clearRes] = await conn.query(
                "UPDATE orders SET kitchen_status = 'preparing' WHERE TRIM(table_no) = TRIM(?) AND business_id = ? AND kitchen_status = 'pending' AND id != ?",
                [table_no, business_id, order_id]
            );
            console.log(`[Auto-Clear Create] Affected rows: ${clearRes.affectedRows}`);
        }

        // B. Insert Details & Deduct Stock (Recipe Aware)
        const batchId = `B${Date.now()}`;
        for (const item of cart_items) {
            // 1. Insert Detail Record
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.qty) || 1;
            await conn.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note, kitchen_batch_id, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [order_id, item.product_id, itemQty, itemPrice, item.note || "", batchId, req.body.kitchen_status || 'preparing']
            );

            // 2. 🚀 AUTOMATED STOCK DEDUCTION (Recipe, Add-on, Size, & Waste Aware)
            const deductStock = async (productId, qtyMultiplier, itemName, sizeLabel = null) => {
                // 🚀 PLAN-BASED LOGIC: Only check for recipes if plan is Advanced (ID >= 6)
                const isAdvancedPlan = (req.plan_id >= 6);

                let recipe = [];
                if (isAdvancedPlan) {
                    const [recipeRows] = await conn.query(
                        "SELECT raw_material_id, qty as quantity, waste_factor FROM recipe_detail WHERE product_id = ? AND business_id = ? AND (size_label = ? OR size_label IS NULL OR size_label = '')",
                        [productId, business_id, sizeLabel]
                    );
                    recipe = recipeRows;
                }

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
                        `, [business_id, branch_id, ingredient.raw_material_id, old_qty, new_qty, -deductQty, `ORD-${order_id}`, `Sale: ${itemName}${sizeLabel ? ' (' + sizeLabel + ')' : ''}`, user_id]);
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

        // 4. Update Member Info (Points, Wallet, Tier)
        if (customer_id) {
            const pointsToAdd = Math.floor(total_amount); // $1 = 1 Point
            let walletDeduction = 0;
            if (payment_method === 'Wallet') {
                walletDeduction = total_amount;
            }

            // Update points, total_spent and wallet_balance
            await conn.query(`
                UPDATE customers 
                SET points = points + ?, 
                    total_spent = total_spent + ?, 
                    wallet_balance = wallet_balance - ? 
                WHERE id = ?
            `, [pointsToAdd, total_amount, walletDeduction, customer_id]);

            // Auto-Tier Upgrade Logic
            const [cust] = await conn.query("SELECT points, tier_id FROM customers WHERE id = ?", [customer_id]);
            if (cust.length > 0) {
                const currentPoints = cust[0].points;
                const [tiers] = await conn.query("SELECT * FROM membership_tiers WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1", [currentPoints]);
                if (tiers.length > 0 && tiers[0].id !== cust[0].tier_id) {
                    await conn.query("UPDATE customers SET tier_id = ? WHERE id = ?", [tiers[0].id, customer_id]);
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
        const { business_id: req_biz_id, branch_id: req_br_id, user_id: session_user_id } = req;
        const { branch_id: query_br_id, from_date, to_date, user_id, txtSearch, shift_id } = req.query;
        const { customer_id: param_customer_id } = req.params;

        // Fallback for public routes
        const business_id = req_biz_id || req.query.business_id;
        const branch_id = req_br_id || query_br_id;

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

        const query_customer_id = req.query.customer_id || param_customer_id;
        if (query_customer_id) {
            sql += " AND o.customer_id = ? ";
            params.push(query_customer_id);
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
            ...(shift_id ? [shift_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : []),
            business_id,
            ...(branch_id ? [branch_id] : []),
            ...(user_id ? [user_id] : []),
            ...(shift_id ? [shift_id] : []),
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
                 ${shift_id ? 'AND o2.shift_id = ?' : ''}
                 AND o2.status != 'cancelled'
                 ${from_date && to_date ? 'AND DATE(o2.created_at) BETWEEN ? AND ?' : ''}
                ) as total_qty
             FROM orders o
             WHERE o.business_id = ? 
             ${branch_id ? 'AND o.branch_id = ?' : ''} 
             ${user_id ? 'AND o.user_id = ?' : ''}
             ${shift_id ? 'AND o.shift_id = ?' : ''}
             AND o.status != 'cancelled'
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}`,
            summaryParams
        );

        // Fetch Expenses for the same period and scope
        const expenseParams = [
            business_id,
            ...(branch_id ? [branch_id] : []),
            ...(shift_id ? [shift_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : [])
        ];
        const [expenses] = await db.query(
            `SELECT 
                SUM(amount) as total_expense,
                SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) as total_cash_expense
             FROM expense
             WHERE business_id = ? 
             ${branch_id ? 'AND branch_id = ?' : ''} 
             ${shift_id ? 'AND shift_id = ?' : ''} 
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
             ${shift_id ? 'AND o.shift_id = ?' : ''} 
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}
             AND o.status != 'cancelled'
             GROUP BY p.id
             ORDER BY total_qty DESC
             LIMIT 5`,
            expenseParams // Same params as expenses (business_id, branch_id, shift, date range)
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

        console.log(`Fetching order details for ID: ${order_id} | Context: ${business_id ? `Staff (Biz:${business_id})` : 'Guest Access'}`);

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
        const { business_id } = req;
        const branch_id = req.query.branch_id || req.branch_id;
        const [list] = await db.query(
            "SELECT id, table_no, status, kitchen_status, order_type, total_amount, created_at FROM orders WHERE business_id = ? AND branch_id = ? AND status = 'unpaid' AND order_type = 'dine_in' AND kitchen_status = 'pending' AND table_no IS NOT NULL AND table_no != '' ORDER BY id DESC",
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

        const isHistory = (is_history === '1' || is_history === 1 || is_history === 'true');

        let sql = `
            SELECT 
                o.id as order_id,
                o.table_no,
                o.order_type,
                o.created_at as order_date,
                od.kitchen_batch_id,
                od.kitchen_status,
                u.name as staff_name,
                GROUP_CONCAT(CONCAT(od.qty, ' x ', p.name) SEPARATOR '\n') as items_summary
            FROM order_details od
            JOIN orders o ON od.order_id = o.id
            JOIN products p ON od.product_id = p.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.business_id = ? AND o.branch_id = ? 
            AND o.status != 'cancelled'
            AND DATE(o.created_at) = CURDATE()
        `;

        if (isHistory) {
            sql += " AND od.kitchen_status = 'served' ";
        } else {
            sql += " AND od.kitchen_status IN ('preparing', 'ready') ";
        }

        sql += " GROUP BY o.id, od.kitchen_batch_id, od.kitchen_status, u.name ";
        sql += " ORDER BY o.id ASC, od.kitchen_batch_id ASC ";

        const [list] = await db.query(sql, [business_id, branch_id]);
        res.json({ list });
    } catch (error) {
        logError("order.getKDSOrders", error, res);
    }
};

// 7. Update Kitchen Status
exports.updateKitchenStatus = async (req, res) => {
    try {
        const { id, order_id, kitchen_batch_id, kitchen_status } = req.body;
        const { business_id } = req;
        const finalId = id || order_id;

        // 1. Update specific items in this batch
        let sql = "UPDATE order_details SET kitchen_status = ? WHERE order_id = ?";
        let params = [kitchen_status, finalId];

        if (kitchen_batch_id) {
            sql += " AND kitchen_batch_id = ?";
            params.push(kitchen_batch_id);
        }

        await db.query(sql, params);

        // 2. Sync Global Order Status ONLY IF ALL items are served
        if (kitchen_status === 'served') {
            const [remaining] = await db.query(
                "SELECT id FROM order_details WHERE order_id = ? AND kitchen_status != 'served'",
                [finalId]
            );
            if (remaining.length === 0) {
                await db.query("UPDATE orders SET kitchen_status = 'served' WHERE id = ?", [finalId]);
            }
        } else {
            // Just update main status to reflect progress (preparing/ready)
            await db.query("UPDATE orders SET kitchen_status = ? WHERE id = ?", [kitchen_status, finalId]);
        }

        res.json({ success: true, message: "Kitchen status updated" });
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
            customer_id, // Link to member if provided
            status // should be 'unpaid'
        } = req.body;

        if (!business_id || !branch_id) {
            return res.status(400).json({ message: "Missing Business or Branch context" });
        }

        // --- 1. DEBOUNCE (Prevent double-clicks) ---
        // If the same table sends the same amount within 10 seconds, ignore it
        const [recent] = await connection.query(
            `SELECT id FROM orders 
             WHERE branch_id = ? AND TRIM(table_no) = TRIM(?) AND total_amount = ? 
             AND created_at >= NOW() - INTERVAL 10 SECOND 
             LIMIT 1`,
            [branch_id, table_no, total_amount]
        );
        if (recent.length > 0) {
            await connection.rollback();
            connection.release();
            return res.json({ success: true, message: "Duplicate request ignored", order_id: recent[0].id });
        }

        // --- 2. PREVENT DUPLICATE ORDERS (Merge if exists) ---
        if (order_type === 'dine_in' && table_no) {
            const [existingOrders] = await connection.query(
                "SELECT id FROM orders WHERE TRIM(table_no) = TRIM(?) AND branch_id = ? AND status = 'unpaid' ORDER BY id DESC LIMIT 1",
                [table_no, branch_id]
            );
            if (existingOrders.length > 0) {
                // REDIRECT TO ADDITIVE UPDATE
                await connection.commit();
                connection.release();
                // Force kitchen_status back to pending so POS staff sees the new items
                req.body.kitchen_status = 'pending';
                return exports.update(req, res, true, existingOrders[0].id);
            }
        }

        // --- GPS VERIFICATION LOGIC ---
        let is_verified = 0;
        if (lat && lng) {
            const [branch] = await connection.query("SELECT lat, lng FROM branches WHERE id = ?", [branch_id]);
            if (branch.length > 0 && branch[0].lat && branch[0].lng) {
                // Calculate distance (Haversine formula)
                const R = 6371e3; // metres
                const φ1 = lat * Math.PI / 180;
                const φ2 = branch[0].lat * Math.PI / 180;
                const Δφ = (branch[0].lat - lat) * Math.PI / 180;
                const Δλ = (branch[0].lng - lng) * Math.PI / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
            (business_id, branch_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, status, kitchen_status, lat, lng, is_verified, customer_id, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW())`,
            [business_id, branch_id, customer_name || 'Web Guest', table_no, sub_total, total_amount, payment_method || 'Unpaid', order_type || 'dine_in', status || 'unpaid', lat, lng, is_verified, customer_id || null]
        );

        const orderId = orderResult.insertId;

        const batchId = `B${Date.now()}`;
        for (const item of cart_items) {
            await connection.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note, kitchen_batch_id, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.qty, item.price, item.note, batchId, req.body.kitchen_status || 'preparing']
            );
        }

        // --- UPDATE CUSTOMER LOYALTY (Points & Tier) ---
        if (customer_id) {
            const pointsToAdd = Math.floor(total_amount);
            await connection.query(
                "UPDATE customers SET points = points + ?, total_spent = total_spent + ? WHERE id = ?",
                [pointsToAdd, total_amount, customer_id]
            );

            // Auto-Tier Upgrade Logic
            const [cust] = await connection.query("SELECT points, tier_id FROM customers WHERE id = ?", [customer_id]);
            if (cust.length > 0) {
                const currentPoints = cust[0].points;
                const [tiers] = await connection.query("SELECT id FROM membership_tiers WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1", [currentPoints]);
                if (tiers.length > 0 && tiers[0].id !== cust[0].tier_id) {
                    await connection.query("UPDATE customers SET tier_id = ? WHERE id = ?", [tiers[0].id, customer_id]);
                }
            }
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
exports.getActiveOrderByTable = async (req, res) => {
    try {
        const { table_no, branch_id } = req.query;
        if (!table_no || !branch_id) {
            return res.status(400).json({ error: "table_no and branch_id are required" });
        }

        // Find the latest unpaid order for this table in this branch
        const [orders] = await db.query(
            `SELECT * FROM orders 
             WHERE table_no = ? AND branch_id = ? AND status = 'unpaid' 
             ORDER BY id DESC LIMIT 1`,
            [table_no, branch_id]
        );

        if (orders.length === 0) {
            return res.json({ order: null });
        }

        const order = orders[0];
        // Fetch details
        const [details] = await db.query(
            `SELECT od.*, p.name as product_name, p.image 
             FROM order_details od
             JOIN products p ON od.product_id = p.id
             WHERE od.order_id = ?`,
            [order.id]
        );

        res.json({
            order: {
                ...order,
                details
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.update = async (req, res, is_additive_param = null, order_id_param = null) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Extract context (Support both authenticated and public routes)
        const business_id = req.business_id || req.body.business_id;
        const branch_id = req.branch_id || req.body.branch_id;
        const plan_id = req.plan_id || 0;
        const user_id = req.user_id || null;

        const {
            order_id: body_order_id,
            customer_name,
            table_no,
            sub_total,
            total_amount,
            total_paid,
            payment_method,
            order_type,
            cart_items,
            status: reqStatus,
            shift_id,
            kitchen_status,
            guest_count
        } = req.body;

        const order_id = order_id_param || body_order_id;
        // CRITICAL FIX: is_additive_param might be the Express 'next' function if called as a route handler
        const is_additive = (is_additive_param === true || req.body.is_additive === true);
        const status = reqStatus || (payment_method ? 'completed' : 'unpaid');

        if (!order_id) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        console.log("Updating order:", { order_id, is_additive, total_amount, itemsCount: cart_items?.length, business_id });

        // A. Update Main Order Record
        // If is_additive, we add to totals instead of overwriting? 
        // No, the POS should ideally calculate the correct NEW totals.
        // But if screen was cleared, POS totals are only for the NEW items.
        // So for additive update, we MUST increment the totals in DB.
        if (is_additive) {
            await conn.query(
                `UPDATE orders SET 
                    sub_total = sub_total + ?, 
                    total_amount = total_amount + ?, 
                    total_paid = total_paid + ?,
                    kitchen_status = COALESCE(?, kitchen_status),
                    guest_count = COALESCE(?, guest_count)
                 WHERE id = ? AND business_id = ?`,
                [Number(sub_total || 0), Number(total_amount || 0), Number(total_paid || 0), kitchen_status || null, guest_count || null, order_id, business_id]
            );
        } else {
            await conn.query(
                `UPDATE orders SET 
                    customer_name = ?, table_no = ?, sub_total = ?, total_amount = ?, 
                    total_paid = ?, payment_method = ?, order_type = ?, status = ?, 
                    shift_id = COALESCE(?, shift_id),
                    kitchen_status = COALESCE(?, kitchen_status),
                    guest_count = COALESCE(?, guest_count)
                 WHERE id = ? AND business_id = ?`,
                [customer_name, table_no, Number(sub_total || 0), Number(total_amount || 0), Number(total_paid || 0), payment_method, order_type, status, shift_id || null, kitchen_status || null, guest_count || null, order_id, business_id]
            );
        }

        // A.1 AUTO-CLEAR PENDING WEB ORDERS for this table
        // SKIP this if it's an additive update (mobile merging), because we want to keep the main order pending
        if (table_no && !is_additive) {
            console.log(`[Auto-Clear Update] Table: ${table_no}, Biz: ${business_id}, Skip ID: ${order_id}`);
            const [clearRes] = await conn.query(
                "UPDATE orders SET kitchen_status = 'preparing' WHERE TRIM(table_no) = TRIM(?) AND business_id = ? AND kitchen_status = 'pending' AND id != ?",
                [table_no, business_id, order_id]
            );
            console.log(`[Auto-Clear Update] Affected rows: ${clearRes.affectedRows}`);
        }

        // B. Update Details & Stock
        // We use server_item_id to track existing rows in order_details
        const currentServerItemIds = cart_items
            .filter(item => item.server_item_id)
            .map(item => item.server_item_id);

        if (is_additive) {
            // --- ADDITIVE MODE: Merge logic ---
            const [existingInDB] = await conn.query("SELECT * FROM order_details WHERE order_id = ?", [order_id]);

            const batchId = `B${Date.now()}`;
            for (const item of cart_items) {
                // If the item already has a server_item_id, it's already in the database.
                // In additive mode, we only want to insert NEW items.
                if (item.server_item_id) continue;

                const qtyToAdd = Number(item.qty || item.cart_qty) || 0;
                const itemPrice = Number(item.price) || 0;
                const itemNote = item.note || "";

                // ALWAYS Insert new row for mobile additive updates to prevent KDS confusion
                // Each 'Place Order' click on mobile creates a fresh batch of items
                await conn.query(
                    "INSERT INTO order_details (order_id, product_id, qty, price, note, kitchen_batch_id, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [order_id, item.product_id, qtyToAdd, itemPrice, itemNote, batchId, 'preparing']
                );
                // Deduct stock for the new entry
                await deductStock(conn, item.product_id, qtyToAdd, business_id, branch_id, plan_id);
            }

            // Recalculate whole order totals to be 100% sure
            const [finalDetails] = await conn.query("SELECT qty, price FROM order_details WHERE order_id = ?", [order_id]);
            let totalSub = 0;
            finalDetails.forEach(d => totalSub += (Number(d.qty) * Number(d.price)));

            await conn.query(
                "UPDATE orders SET sub_total = ?, total_amount = ? WHERE id = ?",
                [totalSub, totalSub, order_id]
            );

        } else {
            // --- FULL SYNC MODE (Standard POS) ---
            // We want to update existing items and insert new ones without losing kitchen status

            // 1. Get all current items in DB to compare
            const [existingItems] = await conn.query("SELECT * FROM order_details WHERE order_id = ?", [order_id]);

            // 2. Process incoming cart items
            const processedIds = [];
            const batchId = `B${Date.now()}`;
            for (const item of cart_items) {
                const qty = Number(item.qty || item.cart_qty) || 0;
                const price = Number(item.price) || 0;
                const note = item.note || "";

                // Try to find if this item already exists in DB
                // Priority 1: Match by server_item_id
                // Priority 2: Match by product_id and note (for robustness)
                let existing = null;
                if (item.server_item_id) {
                    existing = existingItems.find(row => row.id === item.server_item_id);
                } else {
                    // Try to match an item that hasn't been "claimed" yet by another incoming item
                    existing = existingItems.find(row =>
                        row.product_id === item.product_id &&
                        (row.note === note || (!row.note && !note)) &&
                        !processedIds.includes(row.id)
                    );
                }

                if (existing) {
                    // UPDATE existing item - PRESERVES kitchen_status and kitchen_batch_id automatically
                    await conn.query(
                        "UPDATE order_details SET qty = ?, price = ?, note = ? WHERE id = ?",
                        [qty, price, note, existing.id]
                    );
                    processedIds.push(existing.id);
                } else {
                    // INSERT new item - Default to 'pending' if it's a new item during update
                    // or 'preparing' if it's the very first save.
                    // For POS safety, let's use 'preparing' ONLY if the main order is already being prepared
                    const newStatus = kitchen_status || 'pending';
                    await conn.query(
                        "INSERT INTO order_details (order_id, product_id, qty, price, note, kitchen_batch_id, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [order_id, item.product_id, qty, price, note, batchId, newStatus]
                    );
                    await deductStock(conn, item.product_id, qty, business_id, branch_id, plan_id);
                }
            }

            // 3. DELETE items that were not in the incoming cart
            const idsToDelete = existingItems
                .filter(row => !processedIds.includes(row.id))
                .map(row => row.id);

            if (idsToDelete.length > 0) {
                await conn.query("DELETE FROM order_details WHERE id IN (?)", [idsToDelete]);
            }
        }

        // 🌟 AUTO-TRANSITION TO KITCHEN ON COMPLETION (PAYMENT)
        // If the order is now 'completed' (Paid), any items still in 'draft' or 'pending' 
        // should automatically move to 'preparing' so the kitchen sees them.
        if (status === 'completed') {
            await conn.query(
                "UPDATE order_details SET kitchen_status = 'preparing' WHERE order_id = ? AND kitchen_status IN ('draft', 'pending')",
                [order_id]
            );
            // Also sync the main order status if it was draft/pending
            await conn.query(
                "UPDATE orders SET kitchen_status = 'preparing' WHERE id = ? AND kitchen_status IN ('draft', 'pending')",
                [order_id]
            );
        }

        await conn.commit();

        // 3. FETCH UPDATED DETAILS to send back to POS (So it gets new server_item_ids)
        const [updatedDetails] = await conn.query(
            `SELECT od.*, p.name as product_name, p.image 
             FROM order_details od
             LEFT JOIN products p ON od.product_id = p.id
             WHERE od.order_id = ?`,
            [order_id]
        );

        res.json({
            success: true,
            message: "Order updated successfully",
            order_id: order_id,
            details: updatedDetails
        });
    } catch (error) {
        if (conn) await conn.rollback();
        logError("order.update", error, res);
    } finally {
        if (conn) conn.release();
    }
};

exports.sendOrderToKitchen = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { order_id } = req.body;
        const { business_id } = req;

        if (!order_id) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        // 1. Update the order record itself to mark it as needing attention (if not already)
        await conn.query(
            "UPDATE orders SET kitchen_status = 'pending' WHERE id = ? AND business_id = ?",
            [order_id, business_id]
        );

        // 2. Mark all 'pending' items (or newly added items) as ready for kitchen
        // We assign a unique batch ID (timestamp) to group these specific items together in KDS
        const batchId = `B${Date.now()}`;
        await conn.query(
            "UPDATE order_details SET kitchen_status = 'preparing', kitchen_batch_id = ? WHERE order_id = ? AND (kitchen_status = 'pending' OR kitchen_status IS NULL)",
            [batchId, order_id]
        );

        await conn.commit();
        res.json({ success: true, message: "Order items sent to kitchen" });
    } catch (error) {
        if (conn) await conn.rollback();
        logError("order.sendOrderToKitchen", error, res);
    } finally {
        if (conn) conn.release();
    }
};
