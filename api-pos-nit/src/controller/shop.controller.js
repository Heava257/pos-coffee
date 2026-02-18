const { db } = require("../util/helper");
const { logError } = require("../util/logError");

// Get all shops for a user
exports.getShops = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let whereCondition = '';
    let queryParams = [];
    
    if (user_id) {
      whereCondition = 'WHERE s.user_id = ?'; // ✅ Fixed: Specify table alias
      queryParams.push(user_id);
    }
    
    const shopsSql = `
      SELECT 
        s.id,
        s.name,
        s.location,
        s.table_count,
        s.user_id,
        s.created_at,
        u.name as owner_name,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT o.id) as total_orders
      FROM shops s
      LEFT JOIN user u ON s.user_id = u.id
      LEFT JOIN product p ON s.id = p.shop_id
      LEFT JOIN 
      orders o ON s.id = o.shop_id
      ${whereCondition}
      GROUP BY s.id, s.name, s.location, s.table_count, s.user_id, s.created_at, u.name
      ORDER BY s.created_at DESC
    `;

    const [shops] = await db.query(shopsSql, queryParams);

    res.json({
      list: shops,
      total: shops.length
    });
  } catch (error) {
    console.error("Error in shops.getShops:", error);
    res.status(500).json({
      error: "Failed to fetch shops",
      details: error.message
    });
  }
};

// Get single shop details
exports.getShop = async (req, res) => {
  try {
    const shopId = req.params.id;

    const shopSql = `
      SELECT 
        s.id,
        s.name,
        s.location,
        s.table_count,
        s.user_id,
        s.created_at,
        u.name as owner_name,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue
      FROM shops s
      LEFT JOIN user u ON s.user_id = u.id
      LEFT JOIN product p ON s.id = p.shop_id
      LEFT JOIN orders o ON s.id = o.shop_id
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.location, s.table_count, s.user_id, s.created_at, u.name
    `;

    const [shop] = await db.query(shopSql, [shopId]);

    if (shop.length === 0) {
      return res.status(404).json({
        error: "Shop not found"
      });
    }

    res.json(shop[0]);
  } catch (error) {
    console.error("Error in shops.getShop:", error);
    res.status(500).json({
      error: "Failed to fetch shop details",
      details: error.message
    });
  }
};

// Create new shop
exports.createShop = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      location,
      table_count = 10,
      user_id
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ 
        error: "Shop name and location are required" 
      });
    }

    if (!user_id) {
      return res.status(400).json({ 
        error: "User ID is required" 
      });
    }

    // Check if shop name already exists for this user
    const [existingShop] = await connection.query(
      'SELECT id FROM shops WHERE name = ? AND user_id = ?',
      [name, user_id]
    );

    if (existingShop.length > 0) {
      return res.status(400).json({ 
        error: "Shop with this name already exists" 
      });
    }

    // Create shop
    const [shopResult] = await connection.query(
      `INSERT INTO shops (name, location, table_count, user_id, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [name, location, table_count, user_id]
    );

    const shop_id = shopResult.insertId;

    await connection.commit();

    res.json({
      shop_id,
      message: "Shop created successfully!",
      shop: {
        id: shop_id,
        name,
        location,
        table_count,
        user_id
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating shop:", error);
    res.status(500).json({ 
      error: "Failed to create shop", 
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

// Update shop
exports.updateShop = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const shopId = req.params.id;
    const {
      name,
      location,
      table_count,
      user_id
    } = req.body;

    // Check if shop exists
    const [existingShop] = await connection.query(
      'SELECT id, user_id FROM shops WHERE id = ?',
      [shopId]
    );

    if (!existingShop.length) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Check ownership (optional - remove if not needed)
    if (user_id && existingShop[0].user_id !== user_id) {
      return res.status(403).json({ error: "Not authorized to update this shop" });
    }

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      // Check for duplicate name
      const [duplicateCheck] = await connection.query(
        'SELECT id FROM shops WHERE name = ? AND user_id = ? AND id != ?',
        [name, existingShop[0].user_id, shopId]
      );
      
      if (duplicateCheck.length > 0) {
        return res.status(400).json({ error: "Shop with this name already exists" });
      }
      
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    
    if (table_count !== undefined) {
      updateFields.push('table_count = ?');
      updateValues.push(table_count);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateValues.push(shopId);

    await connection.query(
      `UPDATE shops SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    await connection.commit();

    // Get updated shop data
    const [updatedShop] = await connection.query(
      'SELECT * FROM shops WHERE id = ?',
      [shopId]
    );

    res.json({
      message: "Shop updated successfully!",
      shop: updatedShop[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating shop:", error);
    res.status(500).json({ 
      error: "Failed to update shop", 
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

// Delete shop
exports.deleteShop = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const shopId = req.params.id;
    const { user_id } = req.body; // Optional: for ownership check

    // Check if shop exists
    const [existingShop] = await connection.query(
      'SELECT id, user_id, name FROM shops WHERE id = ?',
      [shopId]
    );

    if (!existingShop.length) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Check ownership (optional)
    if (user_id && existingShop[0].user_id !== user_id) {
      return res.status(403).json({ error: "Not authorized to delete this shop" });
    }

    // Check for active orders
    const [activeOrders] = await connection.query(
      'SELECT COUNT(*) as count FROM orders WHERE shop_id = ? AND status = ?',
      [shopId, 'pending']
    );

    if (activeOrders[0].count > 0) {
      return res.status(400).json({ 
        error: "Cannot delete shop with pending orders. Please complete all orders first." 
      });
    }

    // Delete related data (cascade delete)
    // Delete order details first
    await connection.query(
      'DELETE od FROM order_detail od INNER JOIN orders o ON od.order_id = o.id WHERE o.shop_id = ?',
      [shopId]
    );

    // Delete order items
    await connection.query(
      'DELETE oi FROM order_items oi INNER JOIN orders o ON oi.order_id = o.id WHERE o.shop_id = ?',
      [shopId]
    );

    // Delete orders
    await connection.query('DELETE FROM orders WHERE shop_id = ?', [shopId]);

    // Delete products
    await connection.query('DELETE FROM product WHERE shop_id = ?', [shopId]);

    // Delete shop
    await connection.query('DELETE FROM shops WHERE id = ?', [shopId]);

    await connection.commit();

    res.json({
      message: `Shop "${existingShop[0].name}" deleted successfully!`
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting shop:", error);
    res.status(500).json({ 
      error: "Failed to delete shop", 
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get shop-specific products
exports.getShopProducts = async (req, res) => {
  try {
    const shopId = req.params.shop_id;
    const { is_list_all, category_id } = req.query;

    if (!shopId) {
      return res.status(400).json({
        error: "Shop ID is required"
      });
    }

    let whereConditions = ['p.shop_id = ?'];
    let queryParams = [shopId];

    // Add category filter if provided
    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    // Add status filter if not listing all
    if (!is_list_all) {
      whereConditions.push('p.status = 1');
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const productsSql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.discount,
        p.image,
        p.status,
        p.stock,
        p.shop_id,
        p.category_id,
        p.create_at,
        c.name as category_name,
        s.name as shop_name,
        (p.price - (p.price * p.discount / 100)) as discounted_price
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN shops s ON p.shop_id = s.id
      ${whereClause}
      ORDER BY p.create_at DESC
    `;

    const [products] = await db.query(productsSql, queryParams);

    // Format products with proper number types
    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price || 0),
      discount: Number(product.discount || 0),
      stock: Number(product.stock || 0),
      discounted_price: Number(product.discounted_price || 0)
    }));

    res.json({
      list: formattedProducts,
      shop_id: shopId,
      total: formattedProducts.length
    });
  } catch (error) {
    console.error("Error in shops.getShopProducts:", error);
    res.status(500).json({
      error: "Failed to fetch shop products",
      details: error.message
    });
  }
};

// Handle QR code scanning
exports.handleQRScan = async (req, res) => {
  try {
    const { shop, table, shop_id, table_number } = req.query;
    
    // Support both formats: ?shop=1&table=5 or ?shop_id=1&table_number=5
    const finalShopId = shop || shop_id;
    const finalTableNumber = table || table_number;

    if (!finalShopId || !finalTableNumber) {
      return res.status(400).json({
        error: "Invalid QR code data. Shop ID and table number are required."
      });
    }

    // Verify shop exists
    const [shop_data] = await db.query(
      'SELECT id, name, location, table_count FROM shops WHERE id = ?',
      [finalShopId]
    );

    if (shop_data.length === 0) {
      return res.status(404).json({
        error: "Shop not found"
      });
    }

    const shopInfo = shop_data[0];

    // Validate table number
    if (finalTableNumber < 1 || finalTableNumber > shopInfo.table_count) {
      return res.status(400).json({
        error: `Invalid table number. Shop "${shopInfo.name}" has tables 1-${shopInfo.table_count}.`
      });
    }

    // Get shop products (only active products)
    const [products] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.discount,
        p.image,
        p.stock,
        p.category_id,
        c.name as category_name,
        (p.price - (p.price * p.discount / 100)) as discounted_price
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.shop_id = ? AND p.status = 1
      ORDER BY p.create_at DESC
    `, [finalShopId]);

    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price || 0),
      discount: Number(product.discount || 0),
      stock: Number(product.stock || 0),
      discounted_price: Number(product.discounted_price || 0)
    }));

    res.json({
      shop: {
        id: shopInfo.id,
        name: shopInfo.name,
        location: shopInfo.location,
        table_count: shopInfo.table_count
      },
      table_number: parseInt(finalTableNumber),
      products: formattedProducts,
      message: `Welcome to ${shopInfo.name} - Table ${finalTableNumber}`
    });
  } catch (error) {
    console.error("Error in handleQRScan:", error);
    res.status(500).json({
      error: "Failed to process QR code scan",
      details: error.message
    });
  }
};