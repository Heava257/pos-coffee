const { db, logError } = require("../util/helper");

exports.create = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const {
            opening_cash_usd,
            opening_cash_khr,
            actual_cash_usd,
            actual_cash_khr,
            expected_cash_usd,
            total_sales_usd,
            total_aba_usd,
            total_wing_usd,
            diff_usd
        } = req.body;

        const sql = `
            INSERT INTO shifts (
                business_id, branch_id, user_id, 
                opening_cash_usd, opening_cash_khr, 
                actual_cash_usd, actual_cash_khr, 
                expected_cash_usd, total_sales_usd, 
                total_aba_usd, total_wing_usd, diff_usd
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            business_id, branch_id, user_id,
            opening_cash_usd || 0, opening_cash_khr || 0,
            actual_cash_usd || 0, actual_cash_khr || 0,
            expected_cash_usd || 0, total_sales_usd || 0,
            total_aba_usd || 0, total_wing_usd || 0, diff_usd || 0
        ];

        const [result] = await db.query(sql, values);
        res.json({
            success: true,
            message: "Shift closed and saved successfully!",
            id: result.insertId
        });
    } catch (error) {
        logError("shift.create", error, res);
    }
};

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { from_date, to_date, user_id } = req.query;

        let sql = `
            SELECT s.*, u.name as staff_name 
            FROM shifts s 
            LEFT JOIN users u ON s.user_id = u.id 
            WHERE s.business_id = ?
        `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND s.branch_id = ? ";
            params.push(branch_id);
        }

        if (user_id) {
            sql += " AND s.user_id = ? ";
            params.push(user_id);
        }

        if (from_date && to_date) {
            sql += " AND DATE(s.created_at) BETWEEN ? AND ? ";
            params.push(from_date, to_date);
        }

        sql += " ORDER BY s.id DESC ";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("shift.getList", error, res);
    }
};
