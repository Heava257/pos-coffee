const { db, isArray, isEmpty, logError } = require("../util/helper");

// Helper function to check user permissions
const getUserPermissions = async (currentUserId) => {
  const currentUserSql = `SELECT is_super_admin, group_id FROM user WHERE id = ?`;
  const [currentUserResult] = await db.query(currentUserSql, [currentUserId]);
  
  return {
    isSuperAdmin: currentUserResult[0]?.is_super_admin === 1,
    groupId: currentUserResult[0]?.group_id
  };
};

exports.getList = async (req, res) => {
  try {
    let { from_date, to_date } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);
    
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    let groupFilter = '';
    let queryParams = [];
    
    if (!isSuperAdmin) {
      groupFilter = ' AND u.group_id = ?';
      queryParams.push(groupId);
    }

    // Top Sale Query - with group filtering
    let topSaleQuery;
    let topSaleParams = [];
    
    if (isSuperAdmin) {
      topSaleQuery = `
        SELECT 
          p.name AS product_name,
          c.name AS category_name,
          SUM(od.total) AS total_sale_amount
        FROM order_detail od
        JOIN product p ON od.product_id = p.id
        JOIN category c ON p.category_id = c.id
        JOIN \`orders\` o ON od.order_id = o.id
        WHERE 1=1
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN ? AND ?` : ''}
        GROUP BY od.product_id, p.name, c.name
        ORDER BY total_sale_amount DESC
        LIMIT 5
      `;
      if (from_date && to_date) {
        topSaleParams = [from_date, to_date];
      }
    } else {
      topSaleQuery = `
        SELECT 
          p.name AS product_name,
          c.name AS category_name,
          SUM(od.total) AS total_sale_amount
        FROM order_detail od
        JOIN product p ON od.product_id = p.id
        JOIN category c ON p.category_id = c.id
        JOIN \`orders\` o ON od.order_id = o.id
        JOIN user u ON o.user_id = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN ? AND ?` : ''}
        GROUP BY od.product_id, p.name, c.name
        ORDER BY total_sale_amount DESC
        LIMIT 5
      `;
      topSaleParams = [groupId];
      if (from_date && to_date) {
        topSaleParams.push(from_date, to_date);
      }
    }
    
    const [Top_Sale] = await db.query(topSaleQuery, topSaleParams);

    // Customer count - with group filtering
    let customerQuery;
    let customerParams = [];
    
    if (isSuperAdmin) {
      customerQuery = `
        SELECT COUNT(id) AS total 
        FROM customer
        ${from_date && to_date ? `WHERE DATE(create_at) BETWEEN ? AND ?` : ''}
      `;
      if (from_date && to_date) {
        customerParams = [from_date, to_date];
      }
    } else {
      customerQuery = `
        SELECT COUNT(c.id) AS total 
        FROM customer c
        JOIN user u ON c.create_by = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(c.create_at) BETWEEN ? AND ?` : ''}
      `;
      customerParams = [groupId];
      if (from_date && to_date) {
        customerParams.push(from_date, to_date);
      }
    }
    
    const [customer] = await db.query(customerQuery, customerParams);

    // Expense Query - with group filtering
    let expenseQuery;
    let expenseParams = [];
    
    if (isSuperAdmin) {
      expenseQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) AS total, 
          COUNT(id) AS total_expense 
        FROM expense 
        WHERE 1=1
        ${from_date && to_date ? `AND DATE(expense_date) BETWEEN ? AND ?` : ''}
      `;
      if (from_date && to_date) {
        expenseParams = [from_date, to_date];
      }
    } else {
      expenseQuery = `
        SELECT 
          COALESCE(SUM(e.amount), 0) AS total, 
          COUNT(e.id) AS total_expense 
        FROM expense e
        JOIN user u ON e.create_by = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN ? AND ?` : ''}
      `;
      expenseParams = [groupId];
      if (from_date && to_date) {
        expenseParams.push(from_date, to_date);
      }
    }
    
    const [expanse] = await db.query(expenseQuery, expenseParams);

    // Sales data - with group filtering
    let saleQuery;
    let saleParams = [];
    
    if (isSuperAdmin) {
      saleQuery = `
        SELECT 
          COALESCE(SUM(total), 0) AS total_amount, 
          COUNT(id) AS total_order 
        FROM \`orders\` 
        WHERE 1=1
        ${from_date && to_date ? `AND DATE(created_at) BETWEEN ? AND ?` : ''}
      `;
      if (from_date && to_date) {
        saleParams = [from_date, to_date];
      }
    } else {
      saleQuery = `
        SELECT 
          COALESCE(SUM(o.total), 0) AS total_amount, 
          COUNT(o.id) AS total_order 
        FROM \`orders\` o
        JOIN user u ON o.user_id = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN ? AND ?` : ''}
      `;
      saleParams = [groupId];
      if (from_date && to_date) {
        saleParams.push(from_date, to_date);
      }
    }
    
    const [sale] = await db.query(saleQuery, saleParams);

    // Sales summary by month - with group filtering
    let saleSummaryQuery;
    let saleSummaryParams = [];
    
    if (isSuperAdmin) {
      saleSummaryQuery = `
        SELECT 
          DATE_FORMAT(created_at, '%M') AS title, 
          SUM(total) AS total 
        FROM \`orders\` 
        WHERE 1=1
        ${from_date && to_date ? `AND DATE(created_at) BETWEEN ? AND ?` : ''}
        GROUP BY DATE_FORMAT(created_at, '%M'), DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY DATE_FORMAT(created_at, '%Y-%m')
      `;
      if (from_date && to_date) {
        saleSummaryParams = [from_date, to_date];
      }
    } else {
      saleSummaryQuery = `
        SELECT 
          DATE_FORMAT(o.created_at, '%M') AS title, 
          SUM(o.total) AS total 
        FROM \`orders\` o
        JOIN user u ON o.user_id = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN ? AND ?` : ''}
        GROUP BY DATE_FORMAT(o.created_at, '%M'), DATE_FORMAT(o.created_at, '%Y-%m')
        ORDER BY DATE_FORMAT(o.created_at, '%Y-%m')
      `;
      saleSummaryParams = [groupId];
      if (from_date && to_date) {
        saleSummaryParams.push(from_date, to_date);
      }
    }
    
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery, saleSummaryParams);

    // Expense summary by month - with group filtering
    let expenseSummaryQuery;
    let expenseSummaryParams = [];
    
    if (isSuperAdmin) {
      expenseSummaryQuery = `
        SELECT 
          DATE_FORMAT(expense_date, '%M') AS title, 
          SUM(amount) AS total 
        FROM expense 
        WHERE 1=1
        ${from_date && to_date ? `AND DATE(expense_date) BETWEEN ? AND ?` : ''}
        GROUP BY DATE_FORMAT(expense_date, '%M'), DATE_FORMAT(expense_date, '%Y-%m')
        ORDER BY DATE_FORMAT(expense_date, '%Y-%m')
      `;
      if (from_date && to_date) {
        expenseSummaryParams = [from_date, to_date];
      }
    } else {
      expenseSummaryQuery = `
        SELECT 
          DATE_FORMAT(e.expense_date, '%M') AS title, 
          SUM(e.amount) AS total 
        FROM expense e
        JOIN user u ON e.create_by = u.id
        WHERE u.group_id = ?
        ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN ? AND ?` : ''}
        GROUP BY DATE_FORMAT(e.expense_date, '%M'), DATE_FORMAT(e.expense_date, '%Y-%m')
        ORDER BY DATE_FORMAT(e.expense_date, '%Y-%m')
      `;
      expenseSummaryParams = [groupId];
      if (from_date && to_date) {
        expenseSummaryParams.push(from_date, to_date);
      }
    }
    
    const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery, expenseSummaryParams);

    // User summary data - with group filtering
    let userSummaryQuery;
    let userSummaryParams = [];
    
    if (isSuperAdmin) {
      userSummaryQuery = `
        SELECT 
          r.name, 
          COUNT(u.id) AS total_users
        FROM user u
        JOIN role r ON u.role_id = r.id
        GROUP BY r.name
      `;
    } else {
      userSummaryQuery = `
        SELECT 
          r.name, 
          COUNT(u.id) AS total_users
        FROM user u
        JOIN role r ON u.role_id = r.id
        WHERE u.group_id = ?
        GROUP BY r.name
      `;
      userSummaryParams = [groupId];
    }
    
    const [User_Summary] = await db.query(userSummaryQuery, userSummaryParams);

    let dashboard = [
      {
        title: "អ្នកប្រើប្រាស់",
        Summary: {
          "សរុប": User_Summary.reduce((sum, row) => sum + row.total_users, 0) + " នាក់",
          "អ្នកគ្រប់គ្រង": (User_Summary.find(role => role.name === 'Admin')?.total_users || 0) + " នាក់",
          "អ្នកប្រើប្រាស់": (User_Summary.find(role => role.name === 'User')?.total_users || 0) + " នាក់",
        }
      },
    
      {
        title: "ប្រព័ន្ធចំណាយ",
        Summary: {
          "ចំណាយ": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": expanse[0].total + "$",
          "ចំនួនសរុប": expanse[0].total_expense
        }
      },
      {
        title: "ការលក់",
        Summary: {
          "លក់": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": sale[0].total_amount + "$",
          "ការបញ្ជាទិញសរុប": sale[0].total_order
        }
      }
    ];

    res.json({
      dashboard,
      Top_Sale,
      Sale_Summary_By_Month,
      Expense_Summary_By_Month,
      is_super_admin: isSuperAdmin,
      group_id: groupId,
      date_range: {
        from_date,
        to_date
      },
      success: true
    });

  } catch (error) {
    logError("Dashboard.getList", error, res);
  }
};