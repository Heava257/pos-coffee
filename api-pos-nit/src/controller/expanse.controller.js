const { db, isArray, isEmpty, logError } = require("../util/helper");

// exports.getListExpanseType = async (req, res) => {
//   try {
//     const { txtSearch, page = 1, limit = 10 } = req.query;

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit;

//     // Construct SQL query with filters and pagination
//     const sql = `
//       SELECT 
//         e.id,
//         e.name,
//         e.ref_no,
//         e.amount,
//         e.remark,
//         e.expense_date,
//         et.name AS expense_type_name
//       FROM 
//         expense e
//       JOIN 
//         expense_type et ON e.expense_type_id = et.id
//       WHERE 
//         e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch
//       LIMIT :limit OFFSET :offset
//     `;

//     // Execute the query with parameters
//     const [data] = await db.query(sql, {
//       txtSearch: `%${txtSearch || ''}%`, // Add wildcards for partial matching
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//     });

//     // Fetch total count for pagination
//     const countSql = `
//       SELECT COUNT(*) AS total
//       FROM expense e
//       JOIN expense_type et ON e.expense_type_id = et.id
//       WHERE e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch
//     `;

//     const [countResult] = await db.query(countSql, {
//       txtSearch: `%${txtSearch || ''}%`,
//     });

//     const total = countResult[0].total;

//     res.json({
//       success: true,
//       data: data,
//       total: total,
//       message: "Expense list fetched successfully!",
//     });
//   } catch (error) {
//     console.error("Error fetching expense list:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch expense list.",
//     });
//   }
// };


exports.getListExpanseType = async (req, res) => {
  try {
    const { txtSearch, page = 1, limit = 10, expense_type_id } = req.query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Construct SQL query with filters, pagination, and group filtering
    const sql = `
      SELECT 
        e.id,
        e.name,
        e.ref_no,
        e.amount,
        e.remark,
        e.expense_date,
        e.user_id,
        u.group_id,
        u.name as created_by_name,
        u.username as created_by_username,
        et.name AS expense_type_name,
        e.expense_type_id
      FROM 
        expense e
      JOIN 
        expense_type et ON e.expense_type_id = et.id
      INNER JOIN 
        user u ON e.user_id = u.id
      INNER JOIN 
        user cu ON cu.group_id = u.group_id
      WHERE 
        cu.id = :current_user_id
        AND (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT :limit OFFSET :offset
    `;

    // Execute the query with parameters
    const [data] = await db.query(sql, {
      current_user_id: req.current_id,
      txtSearch: `%${txtSearch || ''}%`, // Add wildcards for partial matching
      limit: parseInt(limit),
      offset: parseInt(offset),
      expense_type_id: expense_type_id ? parseInt(expense_type_id) : undefined,
    });

    // Fetch total count for pagination with group filtering
    const countSql = `
      SELECT COUNT(*) AS total
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      INNER JOIN user u ON e.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = :current_user_id
        AND (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
    `;

    const [countResult] = await db.query(countSql, {
      current_user_id: req.current_id,
      txtSearch: `%${txtSearch || ''}%`,
      expense_type_id: expense_type_id ? parseInt(expense_type_id) : undefined,
    });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: data,
      total: total,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      debug: {
        current_user_id: req.current_id,
        txtSearch: txtSearch,
        expense_type_id: expense_type_id,
        total_found: data.length
      },
      message: "Expense list fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching expense list:", error);
    logError("expense.getListExpanseType", error, res);
  }
};

exports.getList = async (req, res) => {
  try {
    var txtSearch = req.query.txtSearch;
    
    // Base SQL with group filtering
    var sql = `
      SELECT 
        e.*,
        u.group_id,
        u.name as created_by_name,
        u.username as created_by_username,
        et.name as expense_type_name
      FROM expense e 
      INNER JOIN user u ON e.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      LEFT JOIN expense_type et ON e.expense_type_id = et.id
      WHERE cu.id = :current_user_id
    `;

    const params = {
      current_user_id: req.current_id
    };

    // Add search filter if provided
    if (!isEmpty(txtSearch)) {
      sql += " AND (e.ref_no LIKE :txtSearch OR e.name LIKE :txtSearch)";
      params.txtSearch = "%" + txtSearch + "%";
    }

    sql += " ORDER BY e.expense_date DESC, e.id DESC";

    const [list] = await db.query(sql, params);
    
    res.json({
      list: list,
      debug: {
        current_user_id: req.current_id,
        txtSearch: txtSearch,
        total_found: list.length,
        sql_used: "Group filtered query"
      }
    });
  } catch (error) {
    logError("expense.getList", error, res);
  }
};
// id,name,code,tel,email,address,website,note,create_by,create_at
// id,:name,:code,:tel,:email,:address,:website,:note,:create_by,:create_at
exports.create = async (req, res) => {
  try {
    const { expense_type_id, ref_no, name, amount, remark, expense_date, user_id } = req.body;

    // Validate required fields
    if (!expense_type_id || !ref_no || !name || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: expense_type_id, ref_no, name, amount, expense_date",
      });
    }

    const sql = `
      INSERT INTO expense 
      (expense_type_id, ref_no, name, amount, remark, expense_date, user_id, create_by) 
      VALUES (:expense_type_id, :ref_no, :name, :amount, :remark, :expense_date, :user_id, :create_by)
    `;

    const [data] = await db.query(sql, {
      expense_type_id,
      ref_no,
      name,
      amount,
      remark,
      expense_date,
      user_id: user_id || req.auth?.id || null, // Use provided user_id or get from auth
      create_by: req.auth?.name || "system",
    });

    res.json({
      success: true,
      data: data,
      message: "Expense created successfully!",
    });
  } catch (error) {
    logError("expense.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, remark, user_id } = req.body;

    if (!name || !amount || !remark) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, amount, remark",
      });
    }
   
    console.log("Request Payload:", req.body);
    
    const sql = `
      UPDATE expense 
      SET 
        name = :name, 
        amount = :amount, 
        remark = :remark,
        user_id = :user_id
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      name,
      amount,
      remark,
      user_id: user_id || req.auth?.id || null, // Use provided user_id or get from auth
      id,
    });

    res.json({
      success: true,
      data: data,
      message: "Expense updated successfully!",
    });
  } catch (error) {
    logError("expense.update", error, res);
  }
};
exports.remove = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters

    // Validate `id`
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required!",
      });
    }

    const sql = "DELETE FROM expense WHERE id = :id";
    const [data] = await db.query(sql, { id });

    // Check if any rows were affected
    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found!",
      });
    }

    res.json({
      success: true,
      data: data,
      message: "Expense deleted successfully!",
    });
  } catch (error) {
    logError("expense.remove", error, res);
  }
};
