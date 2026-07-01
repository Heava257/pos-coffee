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

        if (opening_cash_usd === undefined || opening_cash_usd === null || opening_cash_khr === undefined || opening_cash_khr === null) {
            return res.status(400).json({
                success: false,
                message: "Please provide opening cash for both USD and KHR."
            });
        }

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
            sql += ` AND (
                (s.status = 'Closed' AND DATE(s.closed_at) BETWEEN ? AND ?)
                OR 
                (s.status = 'Open' AND DATE(s.created_at) BETWEEN ? AND ?)
            ) `;
            params.push(from_date, to_date, from_date, to_date);
        }

        sql += " ORDER BY s.id DESC ";

        const [list] = await db.query(sql, params);

        // Dynamically calculate live statistics for currently Open shifts
        for (const s of list) {
            if (s.status === 'Open') {
                const [orders] = await db.query(
                    `SELECT 
                        SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_sales,
                        SUM(CASE WHEN payment_method IN ('ABA', 'KHQR') THEN total_amount ELSE 0 END) as aba_sales,
                        SUM(CASE WHEN payment_method NOT IN ('Cash', 'ABA', 'KHQR') THEN total_amount ELSE 0 END) as other_sales,
                        SUM(total_amount) as total_sales
                     FROM orders 
                     WHERE shift_id = ? AND status != 'cancelled'`,
                    [s.id]
                );
                 const [expenses] = await db.query(
                     `SELECT SUM(amount) as total_expense 
                      FROM expense 
                      WHERE business_id = ? AND branch_id = ? AND created_at >= ?`,
                     [s.business_id, s.branch_id, s.created_at]
                 );
                
                const cashSales = Number(orders[0]?.cash_sales || 0);
                const totalExpense = Number(expenses[0]?.total_expense || 0);
                
                s.total_sales_usd = Number(orders[0]?.total_sales || 0);
                s.total_cash_usd = cashSales;
                s.total_aba_usd = Number(orders[0]?.aba_sales || 0);
                s.total_wing_usd = Number(orders[0]?.other_sales || 0);
                s.total_expense_usd = totalExpense;
                s.expected_cash_usd = Number(s.opening_cash_usd || 0) + cashSales - totalExpense;
                // Live difference is actual (0) - expected
                s.diff_usd = 0;
            }
        }

        res.json({ list });
    } catch (error) {
        logError("shift.getList", error, res);
    }
};

// 5. Get Shift Summary (The logic for Closing Shift / X-Report)
exports.getShiftSummary = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const { id, shift_id } = req.query; // Optional specific shift ID
        const targetId = id || shift_id;

        let currentShift = null;
        if (targetId) {
            const [rows] = await db.query("SELECT * FROM shifts WHERE id = ?", [targetId]);
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
        let salesSql = `
            SELECT 
                payment_method, 
                SUM(total_amount) as total_usd,
                SUM(total_paid) as total_paid_usd
            FROM orders 
            WHERE business_id = ? AND branch_id = ? 
            AND status != 'cancelled'
        `;
        let salesParams = [business_id, branch_id];

        if (id || currentShift.id) {
            salesSql += " AND shift_id = ? ";
            salesParams.push(id || currentShift.id);
        } else {
            salesSql += " AND user_id = ? AND created_at >= ? ";
            salesParams.push(user_id, startTime);
        }

        salesSql += " GROUP BY payment_method ";
        const [sales] = await db.query(salesSql, salesParams);

        // B. Sum Expenses
        const [expenses] = await db.query(`
            SELECT 
                SUM(amount) as total_usd,
                0 as total_khr
            FROM expense 
            WHERE business_id = ? AND branch_id = ? 
            AND created_at >= ?
        `, [business_id, branch_id, startTime]);

        // C. Get Exchange Rate (from business settings or default)
        const [settings] = await db.query("SELECT kh_exchange_rate FROM businesses WHERE id = ?", [business_id]);
        const exchangeRate = settings[0]?.kh_exchange_rate || 4000;

        // D. Breakdown totals
        let totalSalesUSD = 0;
        let cashSalesUSD = 0;
        let abaSalesUSD = 0;
        let wingSalesUSD = 0;

        sales.forEach(s => {
            const method = (s.payment_method || "").toLowerCase();
            const amount = parseFloat(s.total_usd || 0);
            totalSalesUSD += amount;
            
            if (method === 'cash') {
                cashSalesUSD += amount;
            } else if (method === 'wing') {
                wingSalesUSD += amount;
            } else {
                abaSalesUSD += amount;
            }
        });

        const expenseUSD = parseFloat(expenses[0]?.total_usd || 0);
        const expenseKHR = parseFloat(expenses[0]?.total_khr || 0);

        // Expected Cash USD = Opening USD + Cash Sales USD - Expense USD
        const expectedCashUSD = (parseFloat(currentShift.opening_cash_usd || 0)) + cashSalesUSD - expenseUSD;
        // Expected Cash KHR = Opening KHR - Expense KHR (Assuming all sales are converted to USD at POS)
        const expectedCashKHR = (parseFloat(currentShift.opening_cash_khr || 0)) - expenseKHR;

        res.json({
            success: true,
            shift: currentShift,
            summary: {
                total_sales_usd: totalSalesUSD,
                total_cash_usd: cashSalesUSD,
                total_aba_usd: abaSalesUSD,
                total_wing_usd: wingSalesUSD,
                total_expense_usd: expenseUSD,
                total_expense_khr: expenseKHR,
                expected_cash_usd: expectedCashUSD,
                expected_cash_khr: expectedCashKHR,
                exchange_rate: exchangeRate
            }
        });

    } catch (error) {
        logError("shift.getShiftSummary", error, res);
    }
};
