const { db, logError, isEmpty } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    let { from_date, to_date, branch_id: query_branch_id } = req.query;

    // Scoping: Use query_branch_id if provided (for owners), otherwise use user's branch_id
    const target_branch_id = query_branch_id || branch_id;

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    // Common WHERE clause for tenant isolation
    let baseFilter = " WHERE business_id = ? ";
    let baseParams = [business_id];

    if (target_branch_id) {
      baseFilter += " AND branch_id = ? ";
      baseParams.push(target_branch_id);
    }

    // 1. Top Sale Query
    const topSaleQuery = `
      SELECT 
        p.name AS product_name,
        c.name AS category_name,
        SUM(od.qty * od.price) AS total_sale_amount
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.business_id = ? 
      ${target_branch_id ? 'AND o.branch_id = ?' : ''}
      AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY od.product_id, p.name, c.name
      ORDER BY total_sale_amount DESC
      LIMIT 5
    `;
    const topSaleParams = target_branch_id
      ? [business_id, target_branch_id, from_date, to_date]
      : [business_id, from_date, to_date];

    const [Top_Sale] = await db.query(topSaleQuery, topSaleParams);

    // 2. Customer count
    const customerQuery = `
      SELECT COUNT(id) AS total 
      FROM customers
      WHERE business_id = ?
      AND DATE(created_at) BETWEEN ? AND ?
    `;
    const [customer] = await db.query(customerQuery, [business_id, from_date, to_date]);

    // 3. Expense Query
    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total, 
        COUNT(id) AS total_expense 
      FROM expense 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(expense_date) BETWEEN ? AND ?
    `;
    const expenseParams = target_branch_id
      ? [business_id, target_branch_id, from_date, to_date]
      : [business_id, from_date, to_date];
    const [expanse] = await db.query(expenseQuery, expenseParams);

    // 4. Sales data
    const saleQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_amount, 
        COUNT(id) AS total_order 
      FROM orders 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(created_at) BETWEEN ? AND ?
    `;
    const saleParams = target_branch_id
      ? [business_id, target_branch_id, from_date, to_date]
      : [business_id, from_date, to_date];
    const [sale] = await db.query(saleQuery, saleParams);

    // 5. Sales summary by month
    const saleSummaryQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%M') AS title, 
        SUM(total_amount) AS total 
      FROM orders 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(created_at, '%M'), DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
    `;
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery, saleParams);

    // 6. Expense summary by month
    const expenseSummaryQuery = `
      SELECT 
        DATE_FORMAT(expense_date, '%M') AS title, 
        SUM(amount) AS total 
      FROM expense 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(expense_date) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(expense_date, '%M'), DATE_FORMAT(expense_date, '%Y-%m')
      ORDER BY DATE_FORMAT(expense_date, '%Y-%m')
    `;
    const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery, expenseParams);

    // 7. Recent Orders (Live Stream)
    const recentOrdersQuery = `
      SELECT 
        o.id, 
        o.order_no, 
        o.total_amount, 
        o.created_at,
        b.name as branch_name
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      WHERE o.business_id = ?
      ${target_branch_id ? 'AND o.branch_id = ?' : ''}
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    const [recentOrders] = await db.query(recentOrdersQuery, target_branch_id ? [business_id, target_branch_id] : [business_id]);

    const totalSale = Number(sale[0].total_amount) || 0;
    const totalOrder = Number(sale[0].total_order) || 0;
    const totalExpense = Number(expanse[0].total) || 0;
    const avgTransaction = totalOrder > 0 ? (totalSale / totalOrder).toFixed(2) : 0;
    const netProfit = totalSale - totalExpense;
    const profitMargin = totalSale > 0 ? ((netProfit / totalSale) * 100).toFixed(1) : 0;

    const dashboard = [
      {
        title: "Customer Overview",
        Summary: {
          "Total": customer[0].total,
          "Period": `${from_date} - ${to_date}`
        }
      },
      {
        title: "Financial Summary",
        Summary: {
          "Total Sales": `$${totalSale.toLocaleString()}`,
          "Total Expenses": `$${totalExpense.toLocaleString()}`,
          "Net Profit": `$${netProfit.toLocaleString()}`
        }
      },
      {
        title: "Sales Performance",
        Summary: {
          "Order Count": totalOrder,
          "Avg Transaction": `$${avgTransaction}`,
          "Profit Margin": `${profitMargin}%`
        }
      }
    ];

    res.json({
      dashboard,
      Top_Sale,
      Sale_Summary_By_Month,
      Expense_Summary_By_Month,
      recentOrders,
      success: true
    });

  } catch (error) {
    logError("Dashboard.getList", error, res);
  }
};