const { db, logError } = require("../../src/util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const [list] = await db.query(`
            SELECT w.*, p.name as product_name, rm.name as rm_name, u.name as staff_name
            FROM waste w
            LEFT JOIN products p ON w.product_id = p.id
            LEFT JOIN raw_material rm ON w.raw_material_id = rm.id
            LEFT JOIN users u ON w.created_by = u.id
            WHERE w.business_id = ? AND w.branch_id = ?
            ORDER BY w.id DESC
        `, [business_id, branch_id]);
        res.json({ list });
    } catch (error) {
        logError("waste.getList", error, res);
    }
};

exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const { product_id, raw_material_id, qty, reason } = req.body;

        // 1. Insert Waste Record
        const [insertResult] = await conn.query(`
            INSERT INTO waste (business_id, branch_id, product_id, raw_material_id, qty, reason, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [business_id, branch_id, product_id || null, raw_material_id || null, qty, reason, user_id]);

        // 2. Deduct Stock and Log
        if (product_id) {
            const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [product_id, branch_id]);
            const old_qty = bp[0]?.stock_qty || 0;
            const new_qty = old_qty - qty;
            
            await conn.query("UPDATE branch_products SET stock_qty = stock_qty - ? WHERE product_id = ? AND branch_id = ?", [qty, product_id, branch_id]);
            
            await conn.query(`
                INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason, created_by)
                VALUES (?, ?, 'product', ?, ?, ?, ?, 'waste', ?, ?)
            `, [business_id, branch_id, product_id, old_qty, new_qty, -qty, reason, user_id]);
        } else if (raw_material_id) {
            const [rm] = await conn.query("SELECT qty as stock_qty FROM raw_material WHERE id = ?", [raw_material_id]);
            const old_qty = rm[0]?.stock_qty || 0;
            const new_qty = old_qty - qty;

            await conn.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [qty, raw_material_id]);
            
            await conn.query(`
                INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason, created_by)
                VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'waste', ?, ?)
            `, [business_id, branch_id, raw_material_id, old_qty, new_qty, -qty, reason, user_id]);
        }

        await conn.commit();

        const [newRows] = await conn.query(`
            SELECT w.*, p.name as product_name, rm.name as rm_name, u.name as staff_name
            FROM waste w
            LEFT JOIN products p ON w.product_id = p.id
            LEFT JOIN raw_material rm ON w.raw_material_id = rm.id
            LEFT JOIN users u ON w.created_by = u.id
            WHERE w.id = ?
        `, [insertResult.insertId]);

        res.json({ success: true, message: "Waste recorded successfully!", data: newRows[0] });
    } catch (error) {
        await conn.rollback();
        logError("waste.create", error, res);
    } finally {
        conn.release();
    }
};
