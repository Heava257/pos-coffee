const { db, generatePaymentLink } = require("../util/helper");
const axios = require('axios');

const { logError } = require("../util/logError");

// Get list of orders with summary
exports.getList = async (req, res) => {
  try {
    const { from_date, to_date, txtSearch } = req.query;
    const userId = req.params.id; // user_id from URL params

    let whereConditions = [];
    let queryParams = [];

    // Add user filter if provided
    if (userId) {
      whereConditions.push('o.user_id = ?');
      queryParams.push(userId);
    }

    // Add date range filter
    if (from_date && to_date) {
      whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
      queryParams.push(from_date, to_date);
    }

    // Add search filter
    if (txtSearch) {
      whereConditions.push('(o.order_no LIKE ? OR p.name LIKE ? OR c.name LIKE ?)');
      queryParams.push(`%${txtSearch}%`, `%${txtSearch}%`, `%${txtSearch}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get orders with product details - Fixed query
    const ordersSql = `
      SELECT 
        o.id,
        o.order_no,
        o.table_number,
        o.total AS total_amount,
        o.status,
        o.timestamp,
        o.user_id,
        o.payment_method,
        o.created_at,
        GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') as product_names,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') as category_name,
        COUNT(DISTINCT od.product_id) as product_count,
        SUM(od.qty) as total_quantity
      FROM orders o
      LEFT JOIN order_detail od ON o.id = od.order_id
      LEFT JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      ${whereClause}
      GROUP BY o.id, o.order_no, o.table_number, o.total, o.status, o.timestamp, o.user_id, o.payment_method, o.created_at
      ORDER BY o.id DESC
    `;

    const [orders] = await db.query(ordersSql, queryParams);

    // Format the orders data
    const formattedOrders = orders.map(order => ({
      ...order,
      // Format category_name to show product summary
      category_name: order.product_count ?
        `${order.product_count} item${order.product_count > 1 ? 's' : ''} (${order.category_name})` :
        'No items',
      // Add product summary
      product_summary: order.product_names || 'No products'
    }));

    // Calculate summary
    const summary = {
      total_order: orders.length,
      total_amount: orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    };

    res.json({
      list: formattedOrders,
      summary
    });
  } catch (error) {
    console.error("Error in orders.getList:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: error.message
    });
  }
};






// Telegram notification function
const sendTelegramMessagenewcustomerOrder = async (messageText, imageUrls = []) => {
  const TELEGRAM_TOKEN = "7883883844:AAG_DsodDa-Y-zlgMmowlCxNwiQIVJO2kQI";
  const CHAT_ID = "-1002785760693";

  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  try {
    // 1. Send the text message
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });

    // 2. Send each image (if any)
    for (const imageUrl of imageUrls) {
      await axios.post(`${apiBase}/sendPhoto`, {
        chat_id: CHAT_ID,
        photo: imageUrl,
      });
    }

  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
};

// Helper function to format order details for Telegram
const formatOrderForTelegram = (orderData, items) => {
  const {
    order_no,
    table_number,
    total,
    sub_total,
    save_discount,
    tax,
    payment_method,
    timestamp
  } = orderData;

  let message = `🆕 <b>NEW ORDER RECEIVED</b>\n\n`;
  message += `📋 <b>Order No:</b> ${order_no}\n`;
  message += `🪑 <b>Table:</b> ${table_number}\n`;
  message += `⏰ <b>Time:</b> ${timestamp}\n`;
  message += `💳 <b>Payment:</b> ${payment_method || 'Not specified'}\n\n`;

  message += `📦 <b>ITEMS:</b>\n`;
  items.forEach((item, index) => {
    message += `${index + 1}. <b>${item.name}</b>\n`;
    if (item.size?.name) message += `   Size: ${item.size.name}\n`;
    if (item.temperature) message += `   Temperature: ${item.temperature}\n`;
    if (item.sugarLevel) message += `   Sugar: ${item.sugarLevel}\n`;
    if (item.addons && item.addons.length > 0) {
      message += `   Add-ons: ${item.addons.map(a => a.name).join(', ')}\n`;
    }
    message += `   Qty: ${item.quantity} x $${item.originalPrice || 0}\n`;
    if (item.discount_percent > 0 && item.discount_amount > 0) {
      message += `   Discount: -$${Number(item.discount_amount).toFixed(2)} (${Number(item.discount_percent).toFixed(0)}%)\n`;
    }



    message += `   Total: $${item.totalPrice || 0}\n\n`;
  });

  message += `💰 <b>PAYMENT SUMMARY:</b>\n`;
  message += `Sub Total: $${sub_total}\n`;
  if (save_discount > 0) {
    message += `Total Discount: -$${save_discount}\n`;
  }
  if (tax > 0) {
    message += `Tax: $${tax}\n`;
  }
  message += `<b>TOTAL: $${total}</b>\n\n`;

  message += `🎯 Status: PENDING`;

  return message;
};

// Fixed create_byCashie function
exports.create_byCashie = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      order_no,
      table_number = 'Cashie',
      total,
      sub_total = 0,
      save_discount = 0,
      tax = 0,
      status = 'pending',
      timestamp,
      user_id,
      payment_method,
      items = []
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: "Missing items." });
    }

    // Generate order_no if not provided
    const finalOrderNo = order_no || `ORD-${Date.now()}`;
    const finalTimestamp = timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 🔧 FIX: Corrected the SQL parameters order and removed extra comma
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_no,
        table_number, 
        sub_total,
        save_discount,
        tax,
        total, 
        status,
        timestamp,
        user_id,
        payment_method,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalOrderNo,
        table_number || "Cashie",
        sub_total,          // 🔧 FIX: Removed extra comma and parameter
        save_discount,
        tax,
        total,
        status,
        finalTimestamp,
        user_id || null,
        payment_method || null
      ]
    );

    const order_id = orderResult.insertId;

    // Insert into order_items table
    for (const item of items) {
      const product_id = item.product_id || 0;
      const unit_price = item.discountedPrice || item.originalPrice || 0;
      const total_price = item.totalPrice || 0;

      await connection.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_name, size, temperature, sugar_level, addons, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          product_id,
          item.name,
          item.size?.name || "",
          item.temperature || "",
          item.sugarLevel || "",
          item.addons?.map((a) => a.name).join(", ") || "",
          item.quantity,
          unit_price,
          total_price
        ]
      );
    }

    // Insert into order_detail table
    for (const item of items) {
      const product_id = item.product_id || 0;
      const originalPrice = item.originalPrice || 0;
      const discount_percent = item.discount_percent || item.discount || 0;
      const discount_amount = item.discount_amount || 0;
      const total = item.totalPrice || 0;

      await connection.query(
        `INSERT INTO order_detail 
          (order_id, product_id, qty, price, discount, discount_amount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          product_id,
          item.quantity,
          originalPrice,
          discount_percent,
          discount_amount,
          total
        ]
      );
    }

    await connection.commit();

    // Generate payment link
    const paymentLink = await generatePaymentLink({
      orderNo: finalOrderNo,
      total: total,
      customerEmail: req.body.customer_email,
      customerName: req.body.customer_name
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;

    // Send Telegram notification
    try {
      const orderData = {
        order_no: finalOrderNo,
        table_number,
        total,
        sub_total,
        save_discount,
        tax,
        payment_method,
        timestamp: finalTimestamp
      };

      const telegramMessage = formatOrderForTelegram(orderData, items);
      await sendTelegramMessagenewcustomerOrder(telegramMessage);
      console.log('Telegram notification sent successfully');
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
      // Don't fail the order creation if Telegram fails
    }

    res.json({
      order_id,
      order_no: finalOrderNo,
      payment_link: paymentLink,
      qr_code_url: qrCodeUrl,
      message: "Order created successfully!",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  } finally {
    connection.release();
  }
};

exports.create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      order_no,
      table_number,
      total,
      sub_total = 0,
      save_discount = 0,  // 🎯 NEW: Receive total discount savings
      tax = 0,
      status = 'pending',
      timestamp,
      user_id,
      payment_method,
      items = []
    } = req.body;

    if (!table_number || !items.length) {
      return res.status(400).json({ error: "Missing table number or items." });
    }

    // Generate order_no if not provided
    const finalOrderNo = order_no || `ORD-${Date.now()}`;
    const finalTimestamp = timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 🎯 FIX: Insert into orders table with discount savings
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_no,
        table_number, 
        sub_total,
        save_discount,
        tax,
        total, 
        status,
        timestamp,
        user_id,
        payment_method,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalOrderNo,
        table_number,
        sub_total,
        save_discount,  // 🎯 Store total discount savings
        tax,
        total,
        status,
        finalTimestamp,
        user_id || null,
        payment_method || null
      ]
    );

    const order_id = orderResult.insertId;

    // Insert into order_items table
    for (const item of items) {
      const product_id = item.product_id || 0;
      const unit_price = item.discountedPrice || item.originalPrice || 0;
      const total_price = item.totalPrice || 0;

      await connection.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_name, size, temperature, sugar_level, addons, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          product_id,
          item.name,
          item.size?.name || "",
          item.temperature || "",
          item.sugarLevel || "",
          item.addons?.map((a) => a.name).join(", ") || "",
          item.quantity,
          unit_price,
          total_price
        ]
      );
    }

    // 🎯 FIX: Insert into order_detail table with correct discount amounts
    for (const item of items) {
      const product_id = item.product_id || 0;
      const originalPrice = item.originalPrice || 0;
      const discount_percent = item.discount_percent || item.discount || 0;
      const discount_amount = item.discount_amount || 0; // 🎯 Use actual discount amount
      const total = item.totalPrice || 0;

      await connection.query(
        `INSERT INTO order_detail 
          (order_id, product_id, qty, price, discount, discount_amount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          product_id,
          item.quantity,
          originalPrice,     // Original price
          discount_percent,  // Discount percentage
          discount_amount,   // 🎯 NEW: Actual discount amount
          total             // Total after discount
        ]
      );
    }

    await connection.commit();

    // 🎯 NEW: Send Telegram notification
    try {
      const orderData = {
        order_no: finalOrderNo,
        table_number,
        total,
        sub_total,
        save_discount,
        tax,
        payment_method,
        timestamp: finalTimestamp
      };

      const telegramMessage = formatOrderForTelegram(orderData, items);
      await sendTelegramMessagenewcustomerOrder(telegramMessage);
      console.log('Telegram notification sent successfully');
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
      // Don't fail the order creation if Telegram fails
    }

    res.json({
      order_id,
      order_no: finalOrderNo,
      message: "Order created successfully!"
    });
  } catch (error) {
    await connection.rollback();
    logError("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  } finally {
    connection.release();
  }
};
exports.sendTelegramMessagenewcustomerOrder = sendTelegramMessagenewcustomerOrder;
// exports.create = async (req, res) => {
//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const { 
//       order_no,
//       table_number, 
//       total, 
//       sub_total = 0,
//       save_discount = 0,  // 🎯 NEW: Receive total discount savings
//       tax = 0,
//       status = 'pending',
//       timestamp,
//       user_id,
//       payment_method,
//       items = [] 
//     } = req.body;

//     if (!table_number || !items.length) {
//       return res.status(400).json({ error: "Missing table number or items." });
//     }




//     // Generate order_no if not provided
//     const finalOrderNo = order_no || `ORD-${Date.now()}`;
//     const finalTimestamp = timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

//     // 🎯 FIX: Insert into orders table with discount savings
//     const [orderResult] = await connection.query(
//       `INSERT INTO orders (
//         order_no,
//         table_number, 
//         sub_total,
//         save_discount,
//         tax,
//         total, 
//         status,
//         timestamp,
//         user_id,
//         payment_method,
//         created_at
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
//       [
//         finalOrderNo,
//         table_number, 
//         sub_total,
//         save_discount,  // 🎯 Store total discount savings
//         tax,
//         total, 
//         status,
//         finalTimestamp,
//         user_id || null,
//         payment_method || null
//       ]
//     );

//     const order_id = orderResult.insertId;

//     // Insert into order_items table
//     for (const item of items) {
//       const product_id = item.product_id || 0;
//       const unit_price = item.discountedPrice || item.originalPrice || 0;
//       const total_price = item.totalPrice || 0;

//       await connection.query(
//         `INSERT INTO order_items 
//           (order_id, product_id, product_name, size, temperature, sugar_level, addons, quantity, unit_price, total_price)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           order_id,
//           product_id,
//           item.name,
//           item.size?.name || "",
//           item.temperature || "",
//           item.sugarLevel || "",
//           item.addons?.map((a) => a.name).join(", ") || "",
//           item.quantity,
//           unit_price,
//           total_price
//         ]
//       );
//     }

//     // 🎯 FIX: Insert into order_detail table with correct discount amounts
//     for (const item of items) {
//       const product_id = item.product_id || 0;
//       const originalPrice = item.originalPrice || 0;
//       const discount_percent = item.discount_percent || item.discount || 0;
//       const discount_amount = item.discount_amount || 0; // 🎯 Use actual discount amount
//       const total = item.totalPrice || 0;

//       await connection.query(
//         `INSERT INTO order_detail 
//           (order_id, product_id, qty, price, discount, discount_amount, total)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           order_id,
//           product_id,
//           item.quantity,
//           originalPrice,     // Original price
//           discount_percent,  // Discount percentage
//           discount_amount,   // 🎯 NEW: Actual discount amount
//           total             // Total after discount
//         ]
//       );
//     }

//     await connection.commit();

//     res.json({ 
//       order_id, 
//       order_no: finalOrderNo,
//       message: "Order created successfully!" 
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error("Error creating order:", error);
//     res.status(500).json({ error: "Failed to create order", details: error.message });
//   } finally {
//     connection.release();
//   }
// };


// exports.create_byCashie = async (req, res) => {
//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const {
//       order_no,
//       table_number,
//       total,
//       sub_total = 0,
//       save_discount = 0,  // 🎯 NEW: Receive total discount savings
//       tax = 0,
//       status = 'pending',
//       timestamp,
//       user_id,
//       payment_method,
//       items = []
//     } = req.body;

//     if (!table_number || !items.length) {
//       return res.status(400).json({ error: "Missing table number or items." });
//     }




//     // Generate order_no if not provided
//     const finalOrderNo = order_no || `ORD-${Date.now()}`;
//     const finalTimestamp = timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

//     // 🎯 FIX: Insert into orders table with discount savings
//     const [orderResult] = await connection.query(
//       `INSERT INTO orders (
//         order_no,
//         table_number, 
//         sub_total,
//         save_discount,
//         tax,
//         total, 
//         status,
//         timestamp,
//         user_id,
//         payment_method,
//         created_at
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
//       [
//         finalOrderNo,
//         table_number,
//         sub_total,
//         save_discount,  // 🎯 Store total discount savings
//         tax,
//         total,
//         status,
//         finalTimestamp,
//         user_id || null,
//         payment_method || null
//       ]
//     );

//     const order_id = orderResult.insertId;

//     // Insert into order_items table
//     for (const item of items) {
//       const product_id = item.product_id || 0;
//       const unit_price = item.discountedPrice || item.originalPrice || 0;
//       const total_price = item.totalPrice || 0;

//       await connection.query(
//         `INSERT INTO order_items 
//           (order_id, product_id, product_name, size, temperature, sugar_level, addons, quantity, unit_price, total_price)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           order_id,
//           product_id,
//           item.name,
//           item.size?.name || "",
//           item.temperature || "",
//           item.sugarLevel || "",
//           item.addons?.map((a) => a.name).join(", ") || "",
//           item.quantity,
//           unit_price,
//           total_price
//         ]
//       );
//     }

//     // 🎯 FIX: Insert into order_detail table with correct discount amounts
//     for (const item of items) {
//       const product_id = item.product_id || 0;
//       const originalPrice = item.originalPrice || 0;
//       const discount_percent = item.discount_percent || item.discount || 0;
//       const discount_amount = item.discount_amount || 0; // 🎯 Use actual discount amount
//       const total = item.totalPrice || 0;

//       await connection.query(
//         `INSERT INTO order_detail 
//           (order_id, product_id, qty, price, discount, discount_amount, total)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           order_id,
//           product_id,
//           item.quantity,
//           originalPrice,     // Original price
//           discount_percent,  // Discount percentage
//           discount_amount,   // 🎯 NEW: Actual discount amount
//           total             // Total after discount
//         ]
//       );
//     }

//     await connection.commit();
//      const paymentLink = await generatePaymentLink({
//       orderNo: finalOrderNo,
//       total: total,
//       customerEmail: req.body.customer_email,
//       customerName: req.body.customer_name
//     });

//  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
//     res.json({
//       order_id,
//       order_no: finalOrderNo,
//       payment_link: paymentLink,
//       qr_code_url: qrCodeUrl,
//       message: "Order created successfully!",

//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error("Error creating order:", error);
//     res.status(500).json({ error: "Failed to create order", details: error.message });
//   } finally {
//     connection.release();
//   }
// };

// 4. Fix the getone function to properly calculate and display discounts
exports.getone = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        error: "Order ID is required"
      });
    }

    // 🎯 FIX: Get order header with discount information
    const orderHeaderSql = `
      SELECT 
        o.id,
        o.order_no,
        o.table_number,
        o.sub_total,
        o.save_discount,
        o.tax,
        o.total,
        o.status,
        o.timestamp,
        o.user_id,
        o.payment_method,
        o.created_at,
        u.name as user_name,
        u.username as user_email
      FROM orders o
      LEFT JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
    `;

    const [orderHeader] = await db.query(orderHeaderSql, [orderId]);

    if (orderHeader.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    // 🎯 FIX: Get order detail items with proper discount calculations
    const orderDetailSql = `
      SELECT 
        od.id,
        od.order_id,
        od.product_id,
        od.qty as total_quantity,
        od.price,
        od.discount as discount_percent,
        od.discount_amount,
        od.total,
        p.name as product_name,
        p.image,
        p.description as product_description,
        c.id as category_id,
        c.name as category_name,
        (od.qty * od.price) as original_subtotal,
        COALESCE(od.discount_amount, 0) as actual_discount,
        od.total as line_total
      FROM order_detail od
      LEFT JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE od.order_id = ?
      ORDER BY od.id ASC
    `;

    const [orderDetails] = await db.query(orderDetailSql, [orderId]);

    // Format order details with proper discount calculations
    const formattedOrderDetails = orderDetails.map(item => ({
      ...item,
      total_quantity: Number(item.total_quantity || 0),
      price: Number(item.price || 0),
      discount_percent: Number(item.discount_percent || 0),
      discount_amount: Number(item.actual_discount || 0), // 🎯 Use actual discount amount
      total: Number(item.total || 0),
      original_subtotal: Number(item.original_subtotal || 0),
      line_total: Number(item.line_total || 0),
      // 🎯 Calculate savings for display
      savings: Number(item.actual_discount || 0)
    }));

    // 🎯 FIX: Calculate proper summary
    const detailSummary = {
      total_items: orderDetails.length,
      total_quantity: formattedOrderDetails.reduce((sum, item) => sum + item.total_quantity, 0),
      original_subtotal: formattedOrderDetails.reduce((sum, item) => sum + item.original_subtotal, 0),
      total_discount: formattedOrderDetails.reduce((sum, item) => sum + item.discount_amount, 0),
      subtotal: formattedOrderDetails.reduce((sum, item) => sum + item.line_total, 0),
      total_amount: Number(orderHeader[0].total || 0)
    };

    const response = {
      order: {
        ...orderHeader[0],
        total: Number(orderHeader[0].total || 0),
        sub_total: Number(orderHeader[0].sub_total || 0),
        save_discount: Number(orderHeader[0].save_discount || 0), // 🎯 Total savings
        tax: Number(orderHeader[0].tax || 0),
        table_number: Number(orderHeader[0].table_number || 0)
      },
      list: formattedOrderDetails,
      items: formattedOrderDetails,
      summary: detailSummary
    };


    res.json(response);

  } catch (error) {
    console.error("Error in orders.getone:", error);
    res.status(500).json({
      error: "Failed to fetch order details",
      details: error.message
    });
  }
};


// Update order
exports.update = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const orderId = req.params.id;
    const {
      order_no,
      table_number,
      total,
      status,
      timestamp,
      user_id,
      payment_method,
      items = []
    } = req.body;

    // Check if order exists
    const [existingOrder] = await connection.query(
      'SELECT id FROM orders WHERE id = ?',
      [orderId]
    );

    if (!existingOrder.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update orders table
    let updateFields = [];
    let updateValues = [];

    if (order_no !== undefined) {
      updateFields.push('order_no = ?');
      updateValues.push(order_no);
    }
    if (table_number !== undefined) {
      updateFields.push('table_number = ?');
      updateValues.push(table_number);
    }
    if (total !== undefined) {
      updateFields.push('total = ?');
      updateValues.push(total);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (timestamp !== undefined) {
      updateFields.push('timestamp = ?');
      updateValues.push(timestamp);
    }
    if (user_id !== undefined) {
      updateFields.push('user_id = ?');
      updateValues.push(user_id);
    }
    if (payment_method !== undefined) {
      updateFields.push('payment_method = ?');
      updateValues.push(payment_method);
    }

    if (updateFields.length > 0) {
      updateValues.push(orderId);
      await connection.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // If items are provided, update order details
    if (items.length > 0) {
      // Delete existing order details
      await connection.query('DELETE FROM order_detail WHERE order_id = ?', [orderId]);
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // Insert new order items
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items 
            (order_id, product_id, product_name, size, temperature, sugar_level, addons, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id || 0,
            item.name,
            item.size?.name || "",
            item.temperature || "",
            item.sugarLevel || "",
            item.addons?.map((a) => a.name).join(", ") || "",
            item.quantity,
            item.discountedPrice || item.price,
            item.totalPrice
          ]
        );
      }

      // Insert new order details
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_detail 
            (order_id, product_id, qty, price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id || 0,
            item.quantity,
            item.price,
            item.discount || 0.00,
            item.totalPrice
          ]
        );
      }
    }

    await connection.commit();

    res.json({
      order_id: orderId,
      message: "Order updated successfully!"
    });
  } catch (error) {
    await connection.rollback();
    logError("orders.update", error, res);
  } finally {
    connection.release();
  }
};