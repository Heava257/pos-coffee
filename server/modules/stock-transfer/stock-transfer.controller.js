const { db, logError, isArray } = require("../../src/util/helper");

// 1. Get Transfer List (Scoped by Business/Branch)
exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txtSearch } = req.query;

        let sql = `
            SELECT t.*, 
                   fb.name as from_branch_name, 
                   tb.name as to_branch_name,
                   u.name as staff_name,
                   (SELECT COUNT(id) FROM stock_transfer_items WHERE transfer_id = t.id) as total_items
            FROM stock_transfers t
            LEFT JOIN branches fb ON t.from_branch_id = fb.id
            LEFT JOIN branches tb ON t.to_branch_id = tb.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.business_id = ?
        `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND (t.from_branch_id = ? OR t.to_branch_id = ?)";
            params.push(branch_id, branch_id);
        }

        if (txtSearch) {
            sql += " AND t.ref LIKE ?";
            params.push(`%${txtSearch}%`);
        }

        sql += " ORDER BY t.id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("stock_transfer.getList", error, res);
    }
};

// 2. Create New Transfer (Deduct from Source)
exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, user_id } = req;
        const { from_branch_id, to_branch_id, items, note, ref: custom_ref } = req.body;

        if (from_branch_id === to_branch_id) {
            return res.status(400).json({ message: "Cannot transfer to the same branch" });
        }

        const ref = custom_ref || `TRF-${Date.now()}`;

        // A. Insert Master Record
        const [t_res] = await conn.query(
            "INSERT INTO stock_transfers (business_id, from_branch_id, to_branch_id, ref, status, note, created_by) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
            [business_id, from_branch_id, to_branch_id, ref, note, user_id]
        );
        const transfer_id = t_res.insertId;

        // B. Process Items and DEDUCT from Source
        if (items && isArray(items)) {
            for (const item of items) {
                const isRM = item.item_type === 'raw_material';
                const qty = (parseFloat(item.qty) || 0);

                // 1. Insert details
                await conn.query(
                    "INSERT INTO stock_transfer_items (transfer_id, product_id, raw_material_id, qty) VALUES (?, ?, ?, ?)",
                    [transfer_id, isRM ? null : item.id, isRM ? item.id : null, (parseFloat(qty) || 0)]
                );

                // 2. Deduct Stock from source
                if (isRM) {
                    const [rm] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [item.id]);
                    const old_qty = rm[0]?.qty || 0;
                    const new_qty = old_qty - qty;

                    await conn.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [qty, item.id]);

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'transfer_out', ?, 'Stock Transfer Out', ?)
                    `, [business_id, from_branch_id, item.id, old_qty, new_qty, -qty, ref, user_id]);
                } else {
                    const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item.id, from_branch_id]);
                    const old_qty = bp[0]?.stock_qty || 0;
                    const new_qty = old_qty - qty;

                    await conn.query("UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?", [qty, item.id, from_branch_id]);

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'product', ?, ?, ?, ?, 'transfer_out', ?, 'Stock Transfer Out', ?)
                    `, [business_id, from_branch_id, item.id, old_qty, new_qty, -qty, ref, user_id]);
                }
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Transfer created and stock reserved!", ref });
    } catch (error) {
        await conn.rollback();
        logError("stock_transfer.create", error, res);
    } finally {
        conn.release();
    }
};

// 3. Receive Transfer (Add to Destination)
exports.receive = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, user_id } = req;
        const { id } = req.body; // transfer_id

        const [t_rows] = await conn.query("SELECT * FROM stock_transfers WHERE id = ?", [id]);
        if (t_rows.length === 0) return res.status(404).json({ message: "Transfer not found" });
        if (t_rows[0].status !== 'pending') return res.status(400).json({ message: "Transfer already processed" });

        const { to_branch_id, from_branch_id, ref } = t_rows[0];

        // Fetch Items
        const [items] = await conn.query("SELECT * FROM stock_transfer_items WHERE transfer_id = ?", [id]);

        for (const item of items) {
            const isRM = item.raw_material_id !== null;
            const item_id = isRM ? item.raw_material_id : item.product_id;
            const qty = (parseFloat(item.qty) || 0);

            if (isRM) {
                const [rm] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [item_id]);
                const old_qty = rm[0]?.qty || 0;
                const new_qty = old_qty + qty;

                await conn.query("UPDATE raw_material SET qty = qty + ? WHERE id = ?", [qty, item_id]);

                await conn.query(`
                    INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                    VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'transfer_in', ?, 'Stock Transfer Received', ?)
                `, [business_id, to_branch_id, item_id, old_qty, new_qty, qty, ref, user_id]);
            } else {
                const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item_id, to_branch_id]);
                const old_qty = bp[0]?.stock_qty || 0;
                const new_qty = old_qty + qty;

                // Handle duplication/insertion for branch_products
                await conn.query(
                    `INSERT INTO branch_products (branch_id, product_id, stock_qty) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE stock_qty = stock_qty + VALUES(stock_qty)`,
                    [to_branch_id, item_id, qty]
                );

                await conn.query(`
                    INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                    VALUES (?, ?, 'product', ?, ?, ?, ?, 'transfer_in', ?, 'Stock Transfer Received', ?)
                `, [business_id, to_branch_id, item_id, old_qty, new_qty, qty, ref, user_id]);
            }
        }

        // Update status
        await conn.query("UPDATE stock_transfers SET status = 'completed' WHERE id = ?", [id]);

        await conn.commit();
        res.json({ success: true, message: "Transfer received successfully!" });
    } catch (error) {
        await conn.rollback();
        logError("stock_transfer.receive", error, res);
    } finally {
        conn.release();
    }
};

// 4. Cancel Transfer (Return to Source)
exports.cancel = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, user_id } = req;
        const { id } = req.body;

        const [t_rows] = await conn.query("SELECT * FROM stock_transfers WHERE id = ?", [id]);
        if (t_rows.length === 0) return res.status(404).json({ message: "Transfer not found" });
        if (t_rows[0].status !== 'pending') return res.status(400).json({ message: "Only pending transfers can be cancelled" });

        const { from_branch_id, ref } = t_rows[0];

        // Return stock
        const [items] = await conn.query("SELECT * FROM stock_transfer_items WHERE transfer_id = ?", [id]);
        for (const item of items) {
            const isRM = item.raw_material_id !== null;
            const item_id = isRM ? item.raw_material_id : item.product_id;
            const qty = (parseFloat(item.qty) || 0);

            if (isRM) {
                await conn.query("UPDATE raw_material SET qty = qty + ? WHERE id = ?", [qty, item_id]);
            } else {
                await conn.query("UPDATE branch_products SET stock_qty = stock_qty + ? WHERE product_id = ? AND branch_id = ?", [qty, item_id, from_branch_id]);
            }
        }

        await conn.query("UPDATE stock_transfers SET status = 'cancelled' WHERE id = ?", [id]);

        await conn.commit();
        res.json({ success: true, message: "Transfer cancelled and stock returned!" });
    } catch (error) {
        await conn.rollback();
        logError("stock_transfer.cancel", error, res);
    } finally {
        conn.release();
    }
};

// 5. Get Transfer Details
exports.getDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.query(`
            SELECT 
                ti.*,
                COALESCE(p.name, rm.name) as name,
                COALESCE(p.barcode, rm.code) as barcode,
                CASE WHEN ti.raw_material_id IS NOT NULL THEN 'raw_material' ELSE 'product' END as item_type
            FROM stock_transfer_items ti
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN raw_material rm ON ti.raw_material_id = rm.id
            WHERE ti.transfer_id = ?
        `, [id]);
        res.json({ list: items });
    } catch (error) {
        logError("stock_transfer.getDetails", error, res);
    }
};
