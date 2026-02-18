const { db, logError } = require("../util/helper");
// Helper function to check user permissions
const getUserPermissions = async (currentUserId) => {
  const currentUserSql = `SELECT is_super_admin, group_id FROM user WHERE id = ?`;
  const [currentUserResult] = await db.query(currentUserSql, [currentUserId]);
  
  return {
    isSuperAdmin: currentUserResult[0]?.is_super_admin === 1,
    groupId: currentUserResult[0]?.group_id
  };
};

exports.report_Sale_Summary = async (req, res) => {
  try {
    let { from_date, to_date, category_id } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);
    
    let sql;
    let queryParams = { from_date, to_date, category_id };

    if (isSuperAdmin) {
      // Super admin can see all sales
      sql = `
        SELECT 
          DATE_FORMAT(o.created_at, '%d/%m/%Y') AS order_date, 
          SUM(od.total_qty) AS total_qty, 
          SUM(od.total_amount) AS total_amount
        FROM orders o
        INNER JOIN (
            SELECT 
                odl.order_id,
                SUM(odl.qty) AS total_qty,
                SUM(odl.total) AS total_amount
            FROM order_detail odl
            INNER JOIN product p ON odl.product_id = p.id
            WHERE (:category_id IS NULL OR p.category_id = :category_id)
            GROUP BY odl.order_id
        ) od ON o.id = od.order_id
        WHERE DATE(o.created_at) BETWEEN :from_date AND :to_date
        GROUP BY DATE_FORMAT(o.created_at, '%d/%m/%Y')
        ORDER BY o.created_at DESC
      `;
    } else {
      // Regular users can only see sales from their group
      sql = `
        SELECT 
          DATE_FORMAT(o.created_at, '%d/%m/%Y') AS order_date, 
          SUM(od.total_qty) AS total_qty, 
          SUM(od.total_amount) AS total_amount
        FROM orders o
        INNER JOIN user u ON o.user_id = u.id
        INNER JOIN (
            SELECT 
                odl.order_id,
                SUM(odl.qty) AS total_qty,
                SUM(odl.total) AS total_amount
            FROM order_detail odl
            INNER JOIN product p ON odl.product_id = p.id
            WHERE (:category_id IS NULL OR p.category_id = :category_id)
            GROUP BY odl.order_id
        ) od ON o.id = od.order_id
        WHERE DATE(o.created_at) BETWEEN :from_date AND :to_date
        AND u.group_id = :group_id
        GROUP BY DATE_FORMAT(o.created_at, '%d/%m/%Y')
        ORDER BY o.created_at DESC
      `;
      queryParams.group_id = groupId;
    }

    const [list] = await db.query(sql, queryParams);

    res.json({ 
      list,
      is_super_admin: isSuperAdmin
    });
  } catch (error) {
    logError("report.report_Sale_Summary", error, res);
  }
};

exports.report_Expense_Summary = async (req, res) => {
  try {
    let { from_date, to_date, expense_type_id } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);

    // Ensure that to_date includes the entire day
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    let sql;
    let queryParams = { from_date, to_date, expense_type_id };

    if (isSuperAdmin) {
      // Super admin can see all expenses
      sql = `
        SELECT 
          DATE_FORMAT(e.expense_date, '%d-%m-%Y') AS title,
          SUM(e.amount) AS total_amount
        FROM expense e
        WHERE DATE_FORMAT(e.expense_date, '%Y-%m-%d') BETWEEN :from_date AND :to_date
        AND (:expense_type_id IS NULL OR e.expense_type_id = :expense_type_id)
        GROUP BY e.expense_date
        ORDER BY e.expense_date DESC
      `;
    } else {
      // Regular users can only see expenses from their group
      sql = `
        SELECT 
          DATE_FORMAT(e.expense_date, '%d-%m-%Y') AS title,
          SUM(e.amount) AS total_amount
        FROM expense e
        INNER JOIN user u ON e.create_by = u.id
        WHERE DATE_FORMAT(e.expense_date, '%Y-%m-%d') BETWEEN :from_date AND :to_date
        AND (:expense_type_id IS NULL OR e.expense_type_id = :expense_type_id)
        AND u.group_id = :group_id
        GROUP BY e.expense_date
        ORDER BY e.expense_date DESC
      `;
      queryParams.group_id = groupId;
    }

    const [list] = await db.query(sql, queryParams);

    res.json({ 
      list,
      is_super_admin: isSuperAdmin
    });
  } catch (error) {
    logError("report.report_expense_Summary", error, res);
  }
};

exports.report_Customer = async (req, res) => {
  try {
    let { from_date, to_date } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);

    // Ensure that to_date includes the entire day
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    let sql;
    let queryParams = { from_date, to_date };

    if (isSuperAdmin) {
      // Super admin can see all customers
      sql = `
        SELECT 
          DATE_FORMAT(cu.create_at, '%d-%m-%Y') AS title,
          COUNT(cu.id) AS total_amount
        FROM customer cu
        WHERE cu.create_at BETWEEN :from_date AND :to_date
        GROUP BY DATE(cu.create_at)
        ORDER BY cu.create_at ASC
      `;
    } else {
      // Regular users can only see customers from their group
      sql = `
        SELECT 
          DATE_FORMAT(cu.create_at, '%d-%m-%Y') AS title,
          COUNT(cu.id) AS total_amount
        FROM customer cu
        INNER JOIN user u ON cu.create_by = u.id
        WHERE cu.create_at BETWEEN :from_date AND :to_date
        AND u.group_id = :group_id
        GROUP BY DATE(cu.create_at)
        ORDER BY cu.create_at ASC
      `;
      queryParams.group_id = groupId;
    }

    const [list] = await db.query(sql, queryParams);

    res.json({ 
      list,
      is_super_admin: isSuperAdmin
    });
  } catch (error) {
    logError("report.Customer", error, res);
  }
};

exports.report_Purchase_Summary = async (req, res) => {
  try {
    let { from_date, to_date, supplier_id } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);

    // Ensure that to_date includes the entire day
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    let sql;
    let queryParams = { from_date, to_date, supplier_id };

    if (isSuperAdmin) {
      // Super admin can see all purchases
      sql = `
        SELECT 
          DATE_FORMAT(pu.create_at, '%d-%m-%Y') AS title,
          SUM(pu.paid_amount) AS total_amount
        FROM purchase pu
        WHERE DATE_FORMAT(pu.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date
        AND (:supplier_id IS NULL OR pu.supplier_id = :supplier_id)
        GROUP BY pu.create_at
        ORDER BY pu.create_at DESC
      `;
    } else {
      // Regular users can only see purchases from their group
      sql = `
        SELECT 
          DATE_FORMAT(pu.create_at, '%d-%m-%Y') AS title,
          SUM(pu.paid_amount) AS total_amount
        FROM purchase pu
        INNER JOIN user u ON pu.create_by = u.id
        WHERE DATE_FORMAT(pu.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date
        AND (:supplier_id IS NULL OR pu.supplier_id = :supplier_id)
        AND u.group_id = :group_id
        GROUP BY pu.create_at
        ORDER BY pu.create_at DESC
      `;
      queryParams.group_id = groupId;
    }

    const [list] = await db.query(sql, queryParams);

    res.json({ 
      list,
      is_super_admin: isSuperAdmin
    });
  } catch (error) {
    logError("report.report_Purchase_Summary", error, res);
  }
};

exports.top_sale = async (req, res) => {
  try {
    // Get date filter parameters
    let { from_date, to_date } = req.query;
    
    // Get user permissions
    const { isSuperAdmin, groupId } = await getUserPermissions(req.current_id);
    
    // Set default date range if not provided
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    let sql;
    let queryParams = {};

    if (isSuperAdmin) {
      // Super admin can see all top sales
      sql = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          c.name AS category_name,
          SUM(od.total) AS total_sale_amount,
          SUM(od.qty) AS total_quantity,
          COUNT(od.id) AS order_count,
          ROUND(AVG(od.price), 2) AS avg_price
        FROM product p
        JOIN order_detail od ON p.id = od.product_id
        JOIN orders o ON od.order_id = o.id
        JOIN category c ON p.category_id = c.id
        WHERE o.status != 'cancelled'
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN :from_date AND :to_date` : ''}
        GROUP BY p.id, p.name, c.name
        ORDER BY total_sale_amount DESC
        LIMIT 10
      `;
      if (from_date && to_date) {
        queryParams = { from_date, to_date };
      }
    } else {
      // Regular users can only see top sales from their group
      sql = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          c.name AS category_name,
          SUM(od.total) AS total_sale_amount,
          SUM(od.qty) AS total_quantity,
          COUNT(od.id) AS order_count,
          ROUND(AVG(od.price), 2) AS avg_price
        FROM product p
        JOIN order_detail od ON p.id = od.product_id
        JOIN orders o ON od.order_id = o.id
        JOIN user u ON o.user_id = u.id
        JOIN category c ON p.category_id = c.id
        WHERE o.status != 'cancelled'
        AND u.group_id = :group_id
        ${from_date && to_date ? `AND DATE(o.created_at) BETWEEN :from_date AND :to_date` : ''}
        GROUP BY p.id, p.name, c.name
        ORDER BY total_sale_amount DESC
        LIMIT 10
      `;
      queryParams = { group_id: groupId };
      if (from_date && to_date) {
        queryParams.from_date = from_date;
        queryParams.to_date = to_date;
      }
    }

    const [list] = await db.query(sql, queryParams);

    res.json({ 
      list,
      date_range: {
        from_date,
        to_date
      },
      is_super_admin: isSuperAdmin,
      success: true
    });
  } catch (error) {
    logError("top_sale.getlist", error, res);
  }
};