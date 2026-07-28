const { db, logError } = require("../../src/util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txt_search, status } = req.query;

        let sql = "SELECT * FROM raw_material WHERE business_id = ?";
        let params = [business_id];

        if (branch_id) {
            sql += " AND branch_id = ?";
            params.push(branch_id);
        }
        if (txt_search) {
            sql += " AND (name LIKE ? OR code LIKE ?)";
            params.push(`%${txt_search}%`, `%${txt_search}%`);
        }
        if (status) {
            sql += " AND status = ?";
            params.push(status);
        }

        sql += " ORDER BY id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("raw_material.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { name, code, unit, price, qty, min_stock, par_level, status } = req.body;
        const image = req.file?.filename || null;

        const sql = `
      INSERT INTO raw_material 
      (business_id, branch_id, name, code, unit, price, qty, min_stock, par_level, status, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.query(sql, [
            business_id, branch_id, name, code, unit, price || 0, qty || 0, min_stock || 0, par_level || 0, status || 1, image
        ]);

        const [newRows] = await db.query("SELECT * FROM raw_material WHERE id = ?", [result.insertId]);

        res.json({ success: true, message: "Raw material added successfully!", data: newRows[0] });
    } catch (error) {
        logError("raw_material.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { id, name, code, unit, price, qty, min_stock, par_level, status } = req.body;
        const image = req.file?.filename || req.body.image;

        const sql = `
      UPDATE raw_material 
      SET name=?, code=?, unit=?, price=?, qty=?, min_stock=?, par_level=?, status=?, image=? 
      WHERE id=? AND business_id=?
    `;
        await db.query(sql, [
            name, code, unit, price, qty, min_stock, par_level, status, image, id, business_id
        ]);

        const [updatedRows] = await db.query("SELECT * FROM raw_material WHERE id = ?", [id]);

        res.json({ success: true, message: "Raw material updated successfully!", data: updatedRows[0] });
    } catch (error) {
        logError("raw_material.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        await db.query("DELETE FROM raw_material WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "Raw material removed successfully!" });
    } catch (error) {
        logError("raw_material.remove", error, res);
    }
};

exports.getForecast = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        
        // 1. Calculate Average Consumption from last 7 days of sales
        // Formula: Sum(Order Qty * Recipe Qty) / 7
        const [stats] = await db.query(`
            SELECT 
                rm.id as raw_material_id,
                rm.name,
                rm.unit,
                rm.qty as current_stock,
                rm.min_stock,
                rm.par_level,
                SUM(od.qty * rd.qty) as total_consumed_7d
            FROM orders o
            JOIN order_details od ON o.id = od.order_id
            JOIN recipe_detail rd ON od.product_id = rd.product_id
            JOIN raw_material rm ON rd.raw_material_id = rm.id
            WHERE o.business_id = ? 
              AND o.branch_id = ? 
              AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND o.status != 'cancelled'
            GROUP BY rm.id
        `, [business_id, branch_id]);

        const forecast = stats.map(item => {
            const avgDaily = item.total_consumed_7d / 7;
            const next7dUsage = avgDaily * 7;
            const suggestedPurchase = Math.max(0, (next7dUsage + item.min_stock) - item.current_stock);
            
            return {
                ...item,
                avg_daily_usage: avgDaily.toFixed(2),
                expected_7d_usage: next7dUsage.toFixed(2),
                suggested_purchase: suggestedPurchase.toFixed(2),
                status: item.current_stock < next7dUsage ? 'high_risk' : (item.current_stock < (next7dUsage * 1.5) ? 'warning' : 'safe')
            };
        });

        res.json({ list: forecast });
    } catch (error) {
        logError("raw_material.getForecast", error, res);
    }
};
