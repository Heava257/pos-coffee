const { db, isArray, isEmpty, logError } = require("../util/helper");



exports.getStockByUser = async (req, res) => {
  try {
    const { txtSearch } = req.query;
    const { user_id } = req.params; // Get user_id from URL parameter

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // SQL query to join user_stock with product and category tables
    let sql = `
      SELECT 
        us.id,
        us.user_id,
        us.product_name,  -- Replace product_id with product name
        c.name AS category_name, -- Replace category_id with category name
        us.qty,
        us.barcode,
        us.brand,
        us.description,
        us.price,
        us.discount,
        us.status,
     
        us.create_by,
        us.create_at,
        us.unit,
        us.unit_price,
        us.last_updated
      FROM stock us
      LEFT JOIN product p ON us.product_name = p.id  -- Join with product table
      LEFT JOIN category c ON us.category_id = c.id  -- Join with category table
      WHERE us.user_id = :user_id
    `;

    const params = { user_id };

    // Add search functionality
    if (txtSearch) {
      sql += " AND (p.name LIKE :txtSearch OR us.barcode LIKE :txtSearch OR us.brand LIKE :txtSearch OR c.name LIKE :txtSearch)";
      params.txtSearch = `%${txtSearch}%`;
    }

    // Execute the query
    const [list] = await db.query(sql, params);

    // Return the result
    res.json({
      success: true,
      list,
    });
  } catch (error) {
    logError("stock.getList", error, res);
  }
};


exports.create = async (req, res) => {
  try {
    // Extract values from request body
    const { user_id, product_name, category_id, qty, barcode, brand, description, price, discount, status, unit, unit_price } = req.body;

    // Validate required fields
    if (!user_id || !product_name || !category_id || !qty || !unit || !unit_price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (user_id, product_name, category_id, qty, unit, unit_price).",
      });
    }

    // Verify the user exists before proceeding
    const [userExists] = await db.query("SELECT 1 FROM user WHERE id = :user_id LIMIT 1", {
      user_id
    });

    if (!userExists || userExists.length === 0) {
      return res.status(400).json({
        success: false, 
        message: `User with ID ${user_id} does not exist.`,
      });
    }

    // Similar checks could be added for product_id and category_id if needed
    // const [productExists] = await db.query("SELECT 1 FROM products WHERE id = :product_id LIMIT 1", { product_id });
    // if (!productExists  || productExists.length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Product with ID ${product_id} does not exist.`,
    //   });
    // }

    // Insert into the `user_stock` table
    const sql = `
      INSERT INTO stock (
        user_id, product_name, category_id, qty, barcode, brand, description, price, discount, status, create_by, create_at, unit, unit_price, last_updated
      ) VALUES (
        :user_id, :product_name, :category_id, :qty, :barcode, :brand, :description, :price, :discount, :status, :create_by, NOW(), :unit, :unit_price, NOW()
      )
    `;

    const [data] = await db.query(sql, {
      user_id, 
      product_name, 
      category_id,
      qty: Number(qty),
      barcode: barcode || null,
      brand: brand || null,
      description: description || null,
      price: Number(unit_price) * Number(qty),
      discount: discount || 0,
      status: status || 1,
   
      create_by: req.auth?.name || "System",
      unit: unit || null,
      unit_price: Number(unit_price)
    });

    res.json({
      success: true,
      data,
      message: "Insert success!", 
    });
  } catch (error) {
    console.error("Error in user_stock.create:", error.message);
    logError("user_stock.create", error, res);
    
    // More specific error message based on the error code
    let errorMessage = "An error occurred while creating the stock entry.";
    if (error.message && error.message.includes("foreign key constraint fails")) {
      if (error.message.includes("user_id")) {
        errorMessage = "Invalid user ID. The specified user does not exist.";
      } else if (error.message.includes("product_id")) {
        errorMessage = "Invalid product ID. The specified product does not exist.";
      } else if (error.message.includes("category_id")) {
        errorMessage = "Invalid category ID. The specified category does not exist.";
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
    }); 
  }  
};


exports.remove = async (req, res) => {
  try {
    const id = req.params.id || req.body.id; // Check both params & body
    
    if (!id) {
      return res.status(400).json({ message: "Stock ID is required!" });
    }

    var [data] = await db.query("DELETE FROM stock WHERE id = :id", { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Stock not found!" });
    }

    res.json({ message: "Stock deleted successfully!" });
  } catch (error) {
    logError("stock.remove", error, res);
  }
};
  exports.newBarcode = async (req, res) => { 
    try {
      var sql =
        "SELECT " +
        "CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM user_stock), 3, '0')) " +
        "as barcode";
      var [data] = await db.query(sql); 
      res.json({
        barcode: data[0].barcode,
      });
    } catch (error) {
      logError("barcode.create", error, res);
    }
  };
  
  isExistBarcode = async (barcode) => {
    try {
      var sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
      var [data] = await db.query(sql, {
        barcode: barcode,
      });
      if (data.length > 0 && data[0].Total > 0) {
        return true; // ស្ទួន
      }
      return false; // អត់ស្ទួនទេ
    } catch (error) {
      logError("remove.create", error, res);
    }
  };
  


exports.getList = async (req, res) => {
  try {
    const user_id = req.current_id; // Assuming `req.current_id` contains the logged-in user's ID

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const [list] = await db.query(`
      SELECT 
        us.id, 
        us.user_id, 
        us.create_by,  
        us.product_id, 
        p.name AS product_name, 
        us.qty, 
        us.last_updated, 
        us.category_id, 
        us.brand, 
        p.unit_price,
        p.discount,
        p.unit,
        p.barcode,  
        c.name AS category_name,
        (us.qty * p.unit_price) AS total_price
      FROM user_stock us
      JOIN product p ON us.product_id = p.id
      JOIN category c ON us.category_id = c.id
      WHERE us.user_id = :user_id  -- Filter by the logged-in user's ID
      ORDER BY us.id DESC;
    `, { user_id });

    res.json({
      i_know_you_are_id: user_id, // Return the user ID for reference
      list: list,
    });
  } catch (error) {
    logError("user_stock.getList", error, res);
  }
};

// exports.getList = async (req, res) => {
//   try {
//     const user_id = req.current_id; // Assuming this is securely set from authentication middleware

//     if (!user_id) {
//       return res.status(401).json({ error: "Unauthorized: User ID is required" });
//     }

//     const [list] = await db.query(
//       `SELECT 
//         us.id, 
//         us.user_id, 
//         us.create_by,  
//         us.product_id, 
//         p.name AS product_name, 
//         us.qty, 
//         us.last_updated, 
//         us.category_id, 
//         us.brand, 
//         p.unit_price,
//         p.discount,
//         p.unit,
//         p.barcode,  
//         c.name AS category_name,
//         (us.qty * p.unit_price) AS total_price
//       FROM user_stock us
//       JOIN product p ON us.product_id = p.id
//       JOIN category c ON us.category_id = c.id
//       WHERE us.user_id = ?  -- Use positional placeholder
//       ORDER BY us.id DESC;`,
//       [user_id] // Pass parameters as an array
//     );

//     res.json({
//       message: "User stock retrieved successfully",
//       user_id: user_id, // Useful for debugging
//       list: list,
//     });
//   } catch (error) {
//     logError("user_stock.getList", error, res);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.gettotal_due = async (req, res) => {
  try {
    // Fetch total due per customer
    const [list] = await db.query(`
      SELECT 
        o.customer_id, 
        c.name AS customer_name,
        c.address AS branch_name,
        c.tel AS tel,
        u.create_by AS create_by,
        o.create_at AS order_date,
        r.name AS province_name,
        SUM(o.total_amount - o.paid_amount) AS total_due  -- Sum total_due for each customer
      FROM \`order\` o
      JOIN customer c ON o.customer_id = c.id
      JOIN user u ON o.user_id = u.id
      JOIN role r ON u.role_id = r.id
      WHERE (o.total_amount - o.paid_amount) > 0
      GROUP BY o.customer_id  -- Group by customer ID
      ORDER BY MAX(o.create_at) DESC; -- Order by latest order date
    `);

    res.json({
      i_know_you_are_id: req.current_id || null,
      list: list, // List contains unique customers with total due amount
    });
  } catch (error) {
    logError("user_stock.getList", error, res);
  }
};










exports.updateTotalDue = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log the request body for debugging
    
    const { id, paid_amount } = req.body;

    // Better validation with specific error messages
    if (id === undefined || id === null) {
      return res.status(400).json({ error: "Missing required field: id" });
    }
    
    if (paid_amount === undefined || paid_amount === null) {
      return res.status(400).json({ error: "Missing required field: paid_amount" });
    }
    
    // Convert paid_amount to number to ensure it's a valid number
    const paidAmountNum = Number(paid_amount);
    if (isNaN(paidAmountNum)) {
      return res.status(400).json({ error: "paid_amount must be a valid number" });
    }

    // Construct the SQL query to update the paid_amount
    const sql = `
      UPDATE \`order\`
      SET paid_amount = :paid_amount
      WHERE id = :id;
    `;

    // Execute the update query
    const [result] = await db.query(sql, { 
      id, 
      paid_amount: paidAmountNum 
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found with ID: " + id });
    }

    res.json({ success: true, message: "Payment updated successfully" });
  } catch (error) {
    console.error("Error in updateTotalDue:", error);
    logError("user_stock.updateTotalDue", error, res);
    return res.status(500).json({ error: "Server error processing payment update" });
  }
};