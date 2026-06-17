const { db, logError, isEmpty } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id, branch_id, user_id } = req;
    let { from_date, to_date, branch_id: query_branch_id } = req.query;

    const [user] = await db.query("SELECT is_super_admin FROM users WHERE id = ?", [user_id]);
    const isOwner = user.length > 0 && user[0].is_super_admin === 1;

    let target_branch_id = branch_id; 
    if (query_branch_id) {
      if (query_branch_id === 'all' && (isOwner || business_id === 1)) {
        target_branch_id = null;
      } else {
        target_branch_id = query_branch_id;
      }
    }

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    const today = new Date().toISOString().split('T')[0];

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
      LIMIT 10
    `;
    const [Top_Sale] = await db.query(topSaleQuery, [business_id, ...(target_branch_id ? [target_branch_id] : []), from_date, to_date]);

    const [todaySale] = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE business_id = ? ${target_branch_id ? 'AND branch_id = ?' : ''} AND DATE(created_at) = ?
    `, [business_id, ...(target_branch_id ? [target_branch_id] : []), today]);

    const [todayExpense] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expense 
      WHERE business_id = ? ${target_branch_id ? 'AND branch_id = ?' : ''} AND DATE(expense_date) = ?
    `, [business_id, ...(target_branch_id ? [target_branch_id] : []), today]);

    const [prodStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_items,
        SUM(CASE WHEN bp.stock_qty <= bp.min_stock_alert THEN 1 ELSE 0 END) as low_stock_count,
        SUM(bp.stock_qty * bp.cost_price) as total_stock_value
      FROM products p
      JOIN branch_products bp ON p.id = bp.product_id
      WHERE p.business_id = ? ${target_branch_id ? 'AND bp.branch_id = ?' : ''}
    `, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const [matStats] = await db.query(`
      SELECT 
        COUNT(id) as total_items,
        SUM(CASE WHEN qty <= par_level OR qty <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(qty * COALESCE(avg_cost, price)) as total_stock_value
      FROM raw_material
      WHERE business_id = ? ${target_branch_id ? 'AND branch_id = ?' : ''} AND status = 1
    `, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const [lowProdList] = await db.query(`
      SELECT p.name, bp.stock_qty as qty, 'product' as type
      FROM products p
      JOIN branch_products bp ON p.id = bp.product_id
      WHERE p.business_id = ? AND bp.stock_qty <= bp.min_stock_alert
      ${target_branch_id ? 'AND bp.branch_id = ?' : ''}
      ORDER BY bp.stock_qty ASC LIMIT 5
    `, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const [lowMatList] = await db.query(`
      SELECT name, qty, 'material' as type
      FROM raw_material
      WHERE business_id = ? AND (qty <= min_stock OR qty <= par_level) AND status = 1
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      ORDER BY qty ASC LIMIT 5
    `, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const [expiryAlerts] = await db.query(`
        SELECT DISTINCT rm.name, sl.expiry_date, sl.batch_no, rm.qty
        FROM stock_logs sl
        JOIN raw_material rm ON sl.item_id = rm.id
        WHERE sl.item_type = 'raw_material'
        AND sl.expiry_date IS NOT NULL
        AND sl.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND rm.business_id = ?
        ${target_branch_id ? 'AND sl.branch_id = ?' : ''}
        ORDER BY sl.expiry_date ASC LIMIT 5
    `, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const combinedStats = {
      total_items: (prodStats[0]?.total_items || 0) + (matStats[0]?.total_items || 0),
      low_stock_count: (prodStats[0]?.low_stock_count || 0) + (matStats[0]?.low_stock_count || 0),
      total_stock_value: (prodStats[0]?.total_stock_value || 0) + (matStats[0]?.total_stock_value || 0)
    };
    const combinedLowList = [...lowProdList, ...lowMatList].sort((a, b) => a.qty - b.qty).slice(0, 5);

    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total, 
        COUNT(id) AS total_expense 
      FROM expense 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(expense_date) BETWEEN ? AND ?
    `;
    const [expanse] = await db.query(expenseQuery, [business_id, ...(target_branch_id ? [target_branch_id] : []), from_date, to_date]);

    const saleQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_amount, 
        COUNT(id) AS total_order 
      FROM orders 
      WHERE business_id = ?
      ${target_branch_id ? 'AND branch_id = ?' : ''}
      AND DATE(created_at) BETWEEN ? AND ?
    `;
    const [sale] = await db.query(saleQuery, [business_id, ...(target_branch_id ? [target_branch_id] : []), from_date, to_date]);

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
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery, [business_id, ...(target_branch_id ? [target_branch_id] : []), from_date, to_date]);

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
    const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery, [business_id, ...(target_branch_id ? [target_branch_id] : []), from_date, to_date]);

    const recentOrdersQuery = `
      SELECT o.id, o.total_amount, o.created_at, b.name as branch_name
      FROM orders o JOIN branches b ON o.branch_id = b.id
      WHERE o.business_id = ? ${target_branch_id ? 'AND o.branch_id = ?' : ''}
      ORDER BY o.created_at DESC LIMIT 10
    `;
    const [recentOrders] = await db.query(recentOrdersQuery, [business_id, ...(target_branch_id ? [target_branch_id] : [])]);

    const totalSale = Number(sale[0].total_amount) || 0;
    const totalOrder = Number(sale[0].total_order) || 0;
    const totalExpense = Number(expanse[0].total) || 0;
    const netProfit = totalSale - totalExpense;

    res.json({
      today_summary: {
        income: Number(todaySale[0].total),
        expense: Number(todayExpense[0].total)
      },
      stock_summary: {
        ...combinedStats,
        low_stock_list: combinedLowList,
        expiry_alerts: expiryAlerts
      },
      range_summary: {
        total_sale: totalSale,
        total_expense: totalExpense,
        net_profit: netProfit,
        order_count: totalOrder
      },
      Top_Sale,
      Sale_Summary_By_Month,
      Expense_Summary_By_Month,
      recentOrders,
      success: true,
      from_date,
      to_date
    });

  } catch (error) {
    logError("Dashboard.getList", error, res);
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const { business_id } = req;
    if (business_id !== 1) return res.status(403).json({ message: "Forbidden" });

    const [[bizStats]] = await db.query(`
      SELECT 
        (SELECT COUNT(id) FROM businesses) as total_businesses,
        (SELECT COUNT(id) FROM businesses WHERE status = 'active') as active_businesses,
        (SELECT COUNT(id) FROM users) as total_users,
        (SELECT COUNT(id) FROM branches) as total_branches
    `);

    const [newestBusinesses] = await db.query(`
      SELECT b.id, b.name, b.owner_name, b.status, b.created_at, p.name as plan_name
      FROM businesses b
      JOIN subscription_plans p ON b.plan_id = p.id
      ORDER BY b.id DESC
      LIMIT 5
    `);

    const [planDist] = await db.query(`
      SELECT p.name as category, COUNT(b.id) as value
      FROM businesses b
      JOIN subscription_plans p ON b.plan_id = p.id
      GROUP BY p.name
    `);

    const [recentUsers] = await db.query(`
      SELECT u.id, u.name, b.name as business_name, u.created_at, r.name as role_name
      FROM users u
      JOIN businesses b ON u.business_id = b.id
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
      LIMIT 10
    `);

    const [dbSizeRes] = await db.query(`
      SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
      FROM information_schema.TABLES 
      WHERE table_schema = DATABASE()
    `);

    const [totalRowsRes] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM users) as total_users
    `);

    // 6. Anonymous Activity Feed (Privacy-focused)
    const [recentOrders] = await db.query(`
      SELECT 'order' as type, b.name as business_name, o.created_at
      FROM orders o JOIN businesses b ON o.business_id = b.id
      ORDER BY o.id DESC LIMIT 5
    `);

    const [recentProducts] = await db.query(`
      SELECT 'product' as type, b.name as business_name, p.created_at, p.name as item_name
      FROM products p JOIN businesses b ON p.business_id = b.id
      ORDER BY p.id DESC LIMIT 5
    `);

    const [recentStaff] = await db.query(`
      SELECT 'staff' as type, b.name as business_name, u.created_at, u.name as item_name
      FROM users u JOIN businesses b ON u.business_id = b.id
      WHERE u.business_id != 1
      ORDER BY u.id DESC LIMIT 5
    `);

    // Top tenants by volume (Order count, not revenue)
    const [topVolRes] = await db.query(`
      SELECT b.name, COUNT(o.id) as order_count
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE DATE(o.created_at) = CURDATE()
      GROUP BY b.id
      ORDER BY order_count DESC
      LIMIT 5
    `);

    const activityFeed = [...recentOrders, ...recentProducts, ...recentStaff]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({ 
      bizStats, 
      newestBusinesses, 
      planDist, 
      recentUsers, 
      success: true,
      systemHealth: {
        dbSize: parseFloat(dbSizeRes[0].size_mb).toFixed(2),
        totalRows: totalRowsRes[0]
      },
      activityFeed,
      topTenantsByVolume: topVolRes
    });
  } catch (error) {
    logError("Dashboard.getAdminDashboard", error, res);
  }
};

exports.getMorningBriefing = async (req, res) => {
  try {
    const { business_id } = req;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [sales] = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as orders 
      FROM orders WHERE business_id = ? AND DATE(created_at) = ?
    `, [business_id, yesterdayStr]);

    const [expenses] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expense 
      WHERE business_id = ? AND DATE(expense_date) = ?
    `, [business_id, yesterdayStr]);

    const [topItem] = await db.query(`
      SELECT p.name, SUM(od.qty) as qty
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.business_id = ? AND DATE(o.created_at) = ?
      GROUP BY od.product_id, p.name
      ORDER BY qty DESC LIMIT 1
    `, [business_id, yesterdayStr]);

    const [topStaff] = await db.query(`
      SELECT u.name, COUNT(o.id) as orders
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.business_id = ? AND DATE(o.created_at) = ?
      GROUP BY u.id, u.name
      ORDER BY orders DESC LIMIT 1
    `, [business_id, yesterdayStr]);

    const [newVIPs] = await db.query(`
      SELECT COUNT(id) as count FROM customers 
      WHERE business_id = ? AND DATE(created_at) = ?
    `, [business_id, yesterdayStr]);

    res.json({
      success: true,
      data: {
        revenue: Number(sales[0]?.revenue || 0),
        profit: Number(sales[0]?.revenue || 0) - Number(expenses[0]?.total || 0),
        top_item: topItem[0]?.name || "None",
        top_item_qty: topItem[0]?.qty || 0,
        top_staff: topStaff[0]?.name || "None",
        new_vips: newVIPs[0]?.count || 0
      }
    });
  } catch (error) {
    logError("Dashboard.getMorningBriefing", error, res);
  }
};
