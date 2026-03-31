const { db, logError } = require("../util/helper");

// 1. Create (Close) Shift
exports.create = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const {
            id, // ID of the existing open shift
            opening_cash_usd,
            opening_cash_khr,
            actual_cash_usd,
            actual_cash_khr,
            expected_cash_usd,
            total_sales_usd,
            total_cash_usd,
            total_aba_usd,
            total_wing_usd,
            total_expense_usd,
            diff_usd,
            remark
        } = req.body;

        let sql = "";
        let values = [];

        if (id) {
            // Update existing open shift to closed
            sql = `
                UPDATE shifts SET 
                    actual_cash_usd = ?, actual_cash_khr = ?, 
                    expected_cash_usd = ?, total_sales_usd = ?, 
                    total_cash_usd = ?, total_aba_usd = ?, 
                    total_wing_usd = ?, total_expense_usd = ?, 
                    diff_usd = ?, remark = ?, status = 'Closed', 
                    closed_at = CURRENT_TIMESTAMP
                WHERE id = ? AND business_id = ?
            `;
            values = [
                actual_cash_usd || 0, actual_cash_khr || 0,
                expected_cash_usd || 0, total_sales_usd || 0,
                total_cash_usd || 0, total_aba_usd || 0,
                total_wing_usd || 0, total_expense_usd || 0, 
                diff_usd || 0, remark || null,
                id, business_id
            ];
        } else {
            // Create a new closed shift (for backward compatibility or direct creation)
            sql = `
                INSERT INTO shifts (
                    business_id, branch_id, user_id, 
                    opening_cash_usd, opening_cash_khr, 
                    actual_cash_usd, actual_cash_khr, 
                    expected_cash_usd, total_sales_usd, 
                    total_cash_usd, total_aba_usd, total_wing_usd, total_expense_usd, 
                    diff_usd, remark, status, closed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Closed', CURRENT_TIMESTAMP)
            `;
            values = [
                business_id, branch_id, user_id,
                opening_cash_usd || 0, opening_cash_khr || 0,
                actual_cash_usd || 0, actual_cash_khr || 0,
                expected_cash_usd || 0, total_sales_usd || 0,
                total_cash_usd || 0, total_aba_usd || 0, total_wing_usd || 0, total_expense_usd || 0, 
                diff_usd || 0, remark || null
            ];
        }

        const [result] = await db.query(sql, values);
        res.json({
            success: true,
            message: "Shift closed and saved successfully!",
            id: id || result.insertId
        });
    } catch (error) {
        logError("shift.create", error, res);
    }
};

// 2. Open Shift
exports.openShift = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const { opening_cash_usd, opening_cash_khr } = req.body;

        // Check if there's already an open shift for this user/branch
        const [existing] = await db.query(
            "SELECT id FROM shifts WHERE business_id = ? AND branch_id = ? AND user_id = ? AND status = 'Open' LIMIT 1",
            [business_id, branch_id, user_id]
        );

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "You already have an open shift!",
                id: existing[0].id
            });
        }

        const sql = `
            INSERT INTO shifts (
                business_id, branch_id, user_id, 
                opening_cash_usd, opening_cash_khr, 
                status
            ) VALUES (?, ?, ?, ?, ?, 'Open')
        `;
        const values = [business_id, branch_id, user_id, opening_cash_usd || 0, opening_cash_khr || 0];
        const [result] = await db.query(sql, values);

        res.json({
            success: true,
            message: "Shift opened successfully!",
            id: result.insertId
        });
    } catch (error) {
        logError("shift.open", error, res);
    }
};

// 3. Get Current Open Shift
exports.getCurrentShift = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const [list] = await db.query(
            "SELECT * FROM shifts WHERE business_id = ? AND branch_id = ? AND user_id = ? AND status = 'Open' ORDER BY id DESC LIMIT 1",
            [business_id, branch_id, user_id]
        );
        res.json({
            success: true,
            data: list.length > 0 ? list[0] : null
        });
    } catch (error) {
        logError("shift.getCurrentShift", error, res);
    }
};

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { from_date, to_date, user_id } = req.query;

        let sql = `
            SELECT s.*, u.name as staff_name, r.name as role_name 
            FROM shifts s 
            LEFT JOIN users u ON s.user_id = u.id 
            LEFT JOIN roles r ON u.role_id = r.id
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

// 5. Get Shift Summary (The logic for Closing Shift / X-Report)
exports.getShiftSummary = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const { id } = req.query; // Optional specific shift ID

        let currentShift = null;
        if (id) {
            const [rows] = await db.query("SELECT * FROM shifts WHERE id = ?", [id]);
            if (rows.length > 0) currentShift = rows[0];
        } else {
            const [rows] = await db.query(
                "SELECT * FROM shifts WHERE business_id = ? AND branch_id = ? AND user_id = ? AND status = 'Open' ORDER BY id DESC LIMIT 1",
                [business_id, branch_id, user_id]
            );
            if (rows.length > 0) currentShift = rows[0];
        }

        if (!currentShift) {
            return res.status(404).json({ message: "No active shift found" });
        }

        const startTime = currentShift.created_at;

        // A. Sum Sales by Payment Method
        const [sales] = await db.query(`
            SELECT 
                payment_method, 
                SUM(total_amount) as total 
            FROM orders 
            WHERE business_id = ? AND branch_id = ? AND user_id = ? 
            AND created_at >= ? AND status != 'cancelled'
            GROUP BY payment_method
        `, [business_id, branch_id, user_id, startTime]);

        // B. Sum Expenses
        const [expenses] = await db.query(`
            SELECT SUM(amount) as total 
            FROM expense 
            WHERE business_id = ? AND branch_id = ? 
            AND created_at >= ?
        `, [business_id, branch_id, startTime]);

        // C. Breakdown totals
        let totalSales = 0;
        let cashSales = 0;
        let abaSales = 0;
        let wingSales = 0;

        sales.forEach(s => {
            totalSales += parseFloat(s.total || 0);
            if (s.payment_method === 'cash') cashSales = parseFloat(s.total || 0);
            if (s.payment_method === 'qr' || s.payment_method === 'aba' || s.payment_method === 'transfer') abaSales += parseFloat(s.total || 0);
            if (s.payment_method === 'wing') wingSales = parseFloat(s.total || 0);
        });

        const expenseTotal = parseFloat(expenses[0]?.total || 0);

        // Expected Cash = Opening + Cash Sales - Expenses
        const expectedCash = (parseFloat(currentShift.opening_cash_usd || 0)) + cashSales - expenseTotal;

        res.json({
            success: true,
            shift: currentShift,
            summary: {
                total_sales_usd: totalSales,
                total_cash_usd: cashSales,
                total_aba_usd: abaSales,
                total_wing_usd: wingSales,
                total_expense_usd: expenseTotal,
                expected_cash_usd: expectedCash
            }
        });

    } catch (error) {
        logError("shift.getShiftSummary", error, res);
    }
};
