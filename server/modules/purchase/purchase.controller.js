const { db, logError, isArray } = require("../../src/util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txtSearch } = req.query;

        let sql = `
      SELECT p.*, s.name as supplier_name, b.name as branch_name
      FROM purchase p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN branches b ON p.branch_id = b.id
      WHERE p.business_id = ?
    `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND p.branch_id = ? ";
            params.push(branch_id);
        }

        if (txtSearch) {
            sql += " AND (p.ref LIKE ? OR s.name LIKE ?)";
            params.push(`%${txtSearch}%`, `%${txtSearch}%`);
        }

        sql += " ORDER BY p.id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("purchase.getList", error, res);
    }
};

exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const {
            supplier_id,
            total_amount,
            paid_amount,
            note,
            purchase_date,
            status, // Pending, Received, etc.
            items, // [{ product_id, qty, cost, item_type }]
            ref: custom_ref,
            tax_amount,
            discount_amount,
            payment_method
        } = req.body;

        const ref = custom_ref || `PO-${Date.now()}`;

        // 1. Create Purchase record
        const [p_res] = await conn.query(
            "INSERT INTO purchase (business_id, branch_id, supplier_id, ref, total_amount, paid_amount, note, purchase_date, status, created_by, tax_amount, discount_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [business_id, branch_id, supplier_id, ref, total_amount, paid_amount, note, purchase_date || new Date(), status || 'Pending', user_id, tax_amount || 0, discount_amount || 0, payment_method || 'Cash']
        );
        const purchase_id = p_res.insertId;

        // 2. Add items and update inventory (ONLY if status is Received)
        if (items && isArray(items)) {
            for (const item of items) {
                const type = item.item_type || 'product';
                const isRM = type === 'raw_material';

                // A. Insert detail
                await conn.query(
                    `INSERT INTO purchase_product (purchase_id, product_id, raw_material_id, qty, received_qty, cost, batch_no, expiry_date, unit, remark) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        purchase_id,
                        isRM ? null : item.product_id,
                        isRM ? item.product_id : null,
                        item.qty,
                        status === 'Received' ? item.qty : 0,
                        item.cost,
                        item.batch_no || null,
                        item.expiry_date || null,
                        item.unit || null,
                        item.remark || null
                    ]
                );

                // B. Update Stock ONLY if status is Received
                if (status === 'Received') {
                    if (isRM) {
                        const [rm] = await conn.query("SELECT qty, avg_cost, price, conversion_rate FROM raw_material WHERE id = ?", [item.product_id]);
                        const old_qty = Number(rm[0]?.qty || 0);
                        const old_avg_cost = Number(rm[0]?.avg_cost || rm[0]?.price || 0);
                        const rate = Number(rm[0]?.conversion_rate || 1);
                        const actual_qty_to_add = Number(item.qty) * rate;
                        const new_qty = old_qty + actual_qty_to_add;
                        
                        // Weighted Average Cost Calculation (Cost per base unit)
                        const unit_cost = Number(item.cost) / rate;
                        const total_value = (old_qty * old_avg_cost) + (actual_qty_to_add * unit_cost);
                        const new_avg_cost = new_qty > 0 ? total_value / new_qty : unit_cost;

                        await conn.query(
                            "UPDATE raw_material SET qty = ?, price = ?, avg_cost = ? WHERE id = ?",
                            [new_qty, unit_cost, new_avg_cost, item.product_id]
                        );

                        await conn.query(`
                            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by, batch_no, expiry_date, unit_cost)
                            VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'purchase', ?, 'Supplier Purchase', ?, ?, ?, ?)
                        `, [business_id, branch_id, item.product_id, old_qty, new_qty, actual_qty_to_add, ref, user_id, item.batch_no || null, item.expiry_date || null, unit_cost]);

                    } else {
                        const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item.product_id, branch_id]);
                        const old_qty = bp[0]?.stock_qty || 0;
                        const new_qty = old_qty + item.qty;

                        await conn.query(
                            `INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) 
                             VALUES (?, ?, ?, ?, ?) 
                             ON DUPLICATE KEY UPDATE 
                             stock_qty = stock_qty + VALUES(stock_qty),
                             cost_price = VALUES(cost_price)`,
                            [branch_id, item.product_id, (Number(item.cost) || 0) * 1.5, (Number(item.cost) || 0), (Number(item.qty) || 0)]
                        );

                        await conn.query(`
                            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                            VALUES (?, ?, 'product', ?, ?, ?, ?, 'purchase', ?, 'Supplier Purchase', ?)
                        `, [business_id, branch_id, item.product_id, old_qty, new_qty, item.qty, ref, user_id]);
                    }
                }
            }
        }

        await conn.commit();

        // 3. 🚀 AUTO-EXPENSE AUTOMATION: Only if status is Received and paid_amount > 0
        if (status === 'Received' && Number(paid_amount) > 0) {
            try {
                await conn.query(
                    `INSERT INTO expense (business_id, branch_id, expense_type_id, amount, expense_date, description, payment_method, category_class) 
                     VALUES (?, ?, 1, ?, ?, ?, ?, 'COGS')`,
                    [business_id, branch_id, Number(paid_amount), purchase_date || new Date(), `Purchase Received & Paid (Ref: ${ref})`, payment_method || 'Cash']
                );
            } catch (expErr) {
                console.error("Auto-Expense Link Fail:", expErr.message);
            }
        }

        res.json({ success: true, message: "Purchase created, stock updated, and expense recorded!", ref });
    } catch (error) {
        await conn.rollback();
        logError("purchase.create", error, res);
    } finally {
        conn.release();
    }
};

exports.getDetails = async (req, res) => {
    try {
        const { id } = req.query;
        // Fetch items with names from both tables
        const [items] = await db.query(`
            SELECT 
                pp.*,
                COALESCE(p.name, rm.name) as name,
                COALESCE(p.barcode, rm.code) as barcode,
                CASE WHEN pp.raw_material_id IS NOT NULL THEN 'raw_material' ELSE 'product' END as item_type,
                pp.batch_no, pp.expiry_date
            FROM purchase_product pp
            LEFT JOIN products p ON pp.product_id = p.id
            LEFT JOIN raw_material rm ON pp.raw_material_id = rm.id
            WHERE pp.purchase_id = ?
        `, [id]);
        res.json({ list: items });
    } catch (error) {
        logError("purchase.getDetails", error, res);
    }
};

exports.receive = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const { purchase_id, items } = req.body; // items: [{ id (pp_id), receive_now, item_type, real_id }]

        const [p_rows] = await conn.query("SELECT ref FROM purchase WHERE id = ?", [purchase_id]);
        const ref = p_rows[0]?.ref || `RCV-${Date.now()}`;

        for (const item of items) {
            if (item.receive_now > 0) {
                // 1. Update purchase_product with new cost if provided
                await conn.query(
                    "UPDATE purchase_product SET received_qty = received_qty + ?, batch_no = ?, expiry_date = ?, cost = ? WHERE id = ?",
                    [item.receive_now, item.batch_no || null, item.expiry_date || null, item.cost || 0, item.id]
                );

                const currentCost = item.cost || 0;

                // 2. Update stock & cost
                if (item.item_type === 'raw_material') {
                    const [rm] = await conn.query("SELECT qty, avg_cost, price, conversion_rate FROM raw_material WHERE id = ?", [item.real_id]);
                    const old_qty = Number(rm[0]?.qty || 0);
                    const old_avg_cost = Number(rm[0]?.avg_cost || rm[0]?.price || 0);
                    const rate = Number(rm[0]?.conversion_rate || 1);
                    const actual_qty_to_add = Number(item.receive_now) * rate;
                    const new_qty = old_qty + actual_qty_to_add;

                    // Weighted Average Cost Calculation (Cost per base unit)
                    const currentUnitCost = (item.cost || 0) / rate;
                    const total_value = (old_qty * old_avg_cost) + (actual_qty_to_add * currentUnitCost);
                    const new_avg_cost = new_qty > 0 ? total_value / new_qty : currentUnitCost;

                    await conn.query("UPDATE raw_material SET qty = ?, price = ?, avg_cost = ? WHERE id = ?", [new_qty, currentUnitCost, new_avg_cost, item.real_id]);

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by, batch_no, expiry_date, unit_cost)
                        VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'receive', ?, 'Supplier Goods Received', ?, ?, ?, ?)
                    `, [business_id, branch_id, item.real_id, old_qty, new_qty, actual_qty_to_add, ref, user_id, item.batch_no || null, item.expiry_date || null, currentUnitCost]);
                } else {
                    const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item.real_id, branch_id]);
                    const old_qty = bp[0]?.stock_qty || 0;
                    const new_qty = old_qty + item.receive_now;

                    await conn.query(
                        `INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) 
                         VALUES (?, ?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE 
                         stock_qty = stock_qty + VALUES(stock_qty),
                         cost_price = VALUES(cost_price)`,
                        [branch_id, item.real_id, (Number(currentCost) || 0) * 1.5, (Number(currentCost) || 0), (Number(item.receive_now) || 0)]
                    );

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'product', ?, ?, ?, ?, 'receive', ?, 'Supplier Goods Received', ?)
                    `, [business_id, branch_id, item.real_id, old_qty, new_qty, item.receive_now, ref, user_id]);
                }
            }
        }

        // Check if all items fully received to update status
        const [all_items] = await conn.query("SELECT qty, received_qty FROM purchase_product WHERE purchase_id = ?", [purchase_id]);
        const isFull = all_items.every(i => Number(i.received_qty) >= Number(i.qty));
        const isSome = all_items.some(i => Number(i.received_qty) > 0);

        let newStatus = 'Pending';
        if (isFull) newStatus = 'Received';
        else if (isSome) newStatus = 'Partial';

        await conn.query("UPDATE purchase SET status = ? WHERE id = ?", [newStatus, purchase_id]);

        // 3. 🚀 AUTO-EXPENSE AUTOMATION: When items are received, record the value as an expense
        // Calculate total value received in this batch
        const totalReceivedValue = items.reduce((acc, curr) => acc + (Number(curr.receive_now || 0) * Number(curr.cost || 0)), 0);
        
        if (totalReceivedValue > 0) {
            try {
                await conn.query(
                    `INSERT INTO expense (business_id, branch_id, expense_type_id, amount, expense_date, description, payment_method, category_class) 
                     VALUES (?, ?, 1, ?, NOW(), ?, 'Cash', 'COGS')`,
                    [business_id, branch_id, totalReceivedValue, `Inventory Received (PO Ref: ${ref})`]
                );
            } catch (expErr) {
                console.error("Auto-Expense on Receive Fail:", expErr.message);
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Purchase items received and stock updated!" });
    } catch (error) {
        await conn.rollback();
        logError("purchase.receive", error, res);
    } finally {
        conn.release();
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        await db.query("DELETE FROM purchase WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "Purchase record removed!" });
    } catch (error) {
        logError("purchase.remove", error, res);
    }
}

exports.approve = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        
        // Only allow approving if current status is 'Request'
        const [rows] = await db.query("SELECT status FROM purchase WHERE id = ? AND business_id = ?", [id, business_id]);
        if (rows.length === 0) return res.status(404).json({ message: "Purchase not found" });
        if (rows[0].status !== 'Request') return res.status(400).json({ message: "Only purchase requests can be approved" });

        await db.query("UPDATE purchase SET status = 'Approved' WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ success: true, message: "Purchase approved successfully!" });
    } catch (error) {
        logError("purchase.approve", error, res);
    }
};
