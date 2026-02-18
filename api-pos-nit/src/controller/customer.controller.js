const { db, isArray, isEmpty, logError } = require("../util/helper");
// exports.getOne = async (req, res) => {
//   try {
//     const { id: user_id } = req.params; // Extract user_id from URL

//     if (!user_id) {
//       return res.status(400).json({
//         success: false,
//         message: "user_id is required",
//       });
//     }

//     console.log("Fetching customer for user_id:", user_id);

//     // 🔥 Fetch user role from `user` table
//     const [user] = await db.query("SELECT role_id FROM user WHERE id = :user_id", { user_id });

//     if (!user.length) {
//       console.error("User not found:", user_id);
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const role_id = user[0].role_id;
//     console.log("User role_id:", role_id);

//     // ✅ Fetch customer by user_id (role_id removed for now)
//     const [customer] = await db.query(
//       "SELECT * FROM customer WHERE user_id = :user_id LIMIT 1",
//       { user_id }
//     );

//     if (!customer.length) {
//       console.error("Customer not found for user_id:", user_id);
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     console.log("Customer found:", customer[0]);

//     res.json({
//       success: true,
//       customer: customer[0], // Return the first found customer
//     });
//   } catch (error) {
//     console.error("Error in customer.getOne:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while fetching the customer",
//       error: error.message, // Send the actual error for debugging
//     });
//   }
// };

// exports.getList = async (req, res) => {
//   try {
//     const { txtSearch } = req.query;
//     const { user_id } = req.params; // Get user_id from URL parameter

//     if (!user_id) {
//       return res.status(400).json({
//         success: false,
//         message: "user_id is required",
//       });
//     }

//     let sql = "SELECT * FROM customer WHERE user_id = :user_id";
//     const params = { user_id };

//     if (txtSearch) {
//       sql += " AND (name LIKE :txtSearch OR tel LIKE :txtSearch OR email LIKE :txtSearch)";
//       params.txtSearch = `%${txtSearch}%`;
//     }

//     const [list] = await db.query(sql, params);

//     res.json({
//       success: true,
//       list,
//     });
//   } catch (error) {
//     logError("customer.getList", error, res);
//   }
// };
exports.getList = async (req, res) => {
  try {
    const { txtSearch } = req.query;
    const { user_id } = req.params; // Get user_id from URL parameter

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    let sql = "SELECT * FROM customer WHERE user_id = :user_id";
    const params = { user_id };

    if (txtSearch) {
      sql += " AND (name LIKE :txtSearch OR tel LIKE :txtSearch OR email LIKE :txtSearch)";
      params.txtSearch = `%${txtSearch}%`;
    }

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list,
    });
  } catch (error) {
    logError("customer.getList", error, res);
  }
};





// id,name,code,tel,email,address,website,note,create_by,create_at
// id,:name,:code,:tel,:email,:address,:website,:note,:create_by,:create_at
exports.create = async (req, res) => {
  try {
    // Validate required fields
    const { name, tel, email, address, type } = req.body;
    if (!name || !tel || !email || !address || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, tel, email, address, type",
      });
    }

    // Construct SQL query
    const sql = `
      INSERT INTO customer (name, tel, email, address, type, create_by, user_id)
      VALUES (:name, :tel, :email, :address, :type, :create_by, :user_id)
    `;

    // Prepare parameters
    const params = {
      name,
      tel,
      email,
      address,
      type,
      create_by: req.auth?.name || "system", // Default to "system" if create_by is not available
      user_id: req.auth?.id || null, // Ensure user_id is included
    };

    // Execute query
    const [data] = await db.query(sql, params);

    // Send success response
    res.status(201).json({
      success: true,
      data: data,
      message: "Customer created successfully!",
    });
  } catch (error) {
    logError("customer.create", error, res);
  }
};



// exports.createToUser = async (req, res) => {
//   try {
//     // Validate required fields
//     const { name, tel, email, address, type, assigned_user_id } = req.body;
//     if (!name || !tel || !email || !address || !type || !assigned_user_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: name, tel, email, address, type, assigned_user_id",
//       });
//     }

//     // Check if the requester is an Admin
//     if (req.auth?.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only Admin users can create and assign customers.",
//       });
//     }

//     // Validate if the assigned user exists
//     const userCheckSql = `SELECT id FROM user WHERE id = :assigned_user_id`;
//     const [user] = await db.query(userCheckSql, { assigned_user_id });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Assigned user does not exist.",
//       });
//     }

//     // Construct SQL query to insert customer
//     const sql = `
//       INSERT INTO customer (name, tel, email, address, type, create_by, user_id)
//       VALUES (:name, :tel, :email, :address, :type, :create_by, :user_id)
//     `;

//     // Prepare parameters
//     const params = {
//       name,
//       tel,
//       email,
//       address,
//       type,
//       create_by: req.auth?.name || "system", // Default to "system" if create_by is not available
//       user_id: assigned_user_id, // Assign customer to the specified user
//     };

//     // Execute query
//     const [data] = await db.query(sql, params);

//     // Send success response
//     res.status(201).json({
//       success: true,
//       data: data,
//       message: "Customer created and assigned successfully!",
//     });
//   } catch (error) {
//     logError("customer.create", error, res);
//   }
// };

exports.assignCustomerToUser = async (req, res) => {
  try {
    const { customer_id, assigned_user_id } = req.body;

    // Validate required fields
    if (!customer_id || !assigned_user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customer_id, assigned_user_id",
      });
    }

    // Update customer's assigned user
    const sql = `UPDATE customer SET user_id = :assigned_user_id WHERE id = :customer_id`;
    await db.query(sql, { assigned_user_id, customer_id });

    res.status(200).json({
      success: true,
      message: "Customer assigned successfully!",
    });
  } catch (error) {
    console.error("Assign Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while assigning the customer.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters
    const { name, tel, email, address, type } = req.body; // Extract fields from request body

    // Validate required fields
    if (!name || !tel || !email || !address || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, tel, email, address, type",
      });
    }

    const sql = `
      UPDATE customer 
      SET name = :name, tel = :tel, email = :email, address = :address, type = :type 
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      name,
      tel,
      email,
      address,
      type,
      id, // Include `id` in the query parameters
    });

    res.json({
      success: true,
      data: data,
      message: "Customer updated successfully!",
    });
  } catch (error) {
    logError("customer.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters

    // Validate `id`
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required!",
      });
    }

    const sql = "DELETE FROM customer WHERE id = :id";
    const [data] = await db.query(sql, { id });

    // Check if any rows were affected
    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found!",
      });
    }

    res.json({
      success: true,
      data: data,
      message: "Customer deleted successfully!",
    });
  } catch (error) {
    logError("customer.remove", error, res);
  }
};
