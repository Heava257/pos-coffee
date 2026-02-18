// const { db, isArray, isEmpty, logError } = require("../util/helper");
// exports.getList = async (req, res) => {
//   try {
//     const from_date = req.query.from_date;
//     const to_date = req.query.to_date;
//     const txtSearch = req.query.txtSearch;
//     const user_id = req.params.user_id;

//     if (!user_id) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     // Build SQL for orders with group filtering
//     let sqlSelect = `
//       SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address,
//              u.group_id, u.name as created_by_name, u.username as created_by_username
//     `;
//     let sqlJoin = `
//       FROM \`order\` o
//       LEFT JOIN customer c ON o.customer_id = c.id
//       INNER JOIN user u ON o.user_id = u.id
//       INNER JOIN user cu ON cu.group_id = u.group_id
//     `;
//     let sqlWhere = ` WHERE o.user_id = :user_id AND cu.id = :current_user_id`;

//     if (!isEmpty(from_date) && isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
//     } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
//     } else if (isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
//     }

//     if (!isEmpty(txtSearch)) {
//       sqlWhere += ` AND o.order_no LIKE :txtSearch `;
//     }

//     const sqlParams = {
//       user_id: user_id,
//       current_user_id: req.current_id, // Add current user ID for group filtering
//       txtSearch: "%" + txtSearch + "%",
//       from_date: from_date,
//       to_date: to_date,
//     };

//     const sqlList = sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC";
//     const sqlSummary = `
//       SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount 
//       ${sqlJoin} ${sqlWhere}
//     `;

//     // Step 1: Fetch orders
//     const [list] = await db.query(sqlList, sqlParams);
//     const [summaryArray] = await db.query(sqlSummary, sqlParams);
//     const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

//     const orderIds = list.map((order) => order.id);
//     let productMap = {};

//     // Step 2: Fetch products per order (with group filtering)
//     if (orderIds.length > 0) {
//       const [productDetails] = await db.query(`
//         SELECT 
//           od.order_id,
//           p.name AS product_name,
//           c.name AS category_name,
//           od.qty,
//           od.price,
//           od.discount,
//           (od.qty * od.price * (1 - COALESCE(od.discount, 0)/100)) AS total,
//           pu.group_id as product_user_group_id
//         FROM order_detail od
//         JOIN product p ON od.product_id = p.id
//         LEFT JOIN category c ON p.category_id = c.id
//         INNER JOIN user pu ON p.user_id = pu.id
//         INNER JOIN user cu ON cu.group_id = pu.group_id
//         WHERE od.order_id IN (?) AND cu.id = ?
//       `, [orderIds, req.current_id]);

//       // Step 3: Group products by order_id
//       productDetails.forEach(item => {
//         if (!productMap[item.order_id]) {
//           productMap[item.order_id] = [];
//         }
//         productMap[item.order_id].push(item);
//       });
//     }

//     // Step 4: Merge into list
//     const finalList = list.map(order => ({
//       ...order,
//       products: productMap[order.id] || []
//     }));

//     res.json({
//       list: finalList,
//       summary: summary,
//       debug: {
//         current_user_id: req.current_id,
//         total_orders: finalList.length,
//         user_id_filter: user_id
//       }
//     });
//   } catch (error) { 
//     logError("order.getList", error, res);
//   }
// };

// exports.getone = async (req, res) => {
//   try {
//     var sql = `
//       SELECT 
//         od.order_id,
//         p.name AS product_name,
//         c.name AS category_name,
//         p.unit_price,
//         p.discount,
//         p.unit,
//         SUM(od.qty) AS total_quantity,
//         SUM(od.qty * p.unit_price * (1 - COALESCE(p.discount, 0)/100) / NULLIF(p.actual_price, 0)) AS grand_total,
//         pu.group_id as product_user_group_id,
//         pu.name as product_created_by_name,
//         pu.username as product_created_by_username
//       FROM order_detail od
//       INNER JOIN product p ON od.product_id = p.id
//       INNER JOIN category c ON p.category_id = c.id
//       INNER JOIN user pu ON p.user_id = pu.id
//       INNER JOIN user cu ON cu.group_id = pu.group_id
//       INNER JOIN \`order\` o ON od.order_id = o.id
//       INNER JOIN user ou ON o.user_id = ou.id
//       INNER JOIN user cuo ON cuo.group_id = ou.group_id
//       WHERE od.order_id = ? AND cu.id = ? AND cuo.id = ?
//       GROUP BY od.order_id, p.name, c.name, p.unit_price, p.discount, p.unit, pu.group_id, pu.name, pu.username
//     `;

//     const [list] = await db.query(sql, [
//       req.params.id, 
//       req.current_id, // Filter products by current user's group
//       req.current_id  // Filter orders by current user's group
//     ]);
    
//     res.json({ 
//       list,
//       debug: {
//         current_user_id: req.current_id,
//         order_id: req.params.id,
//         total_items: list.length
//       }
//     });
//   } catch (error) {
//     logError("order.getone", error, res);
//   }
// };
// exports.create = async (req, res) => {
//   try {
//     const { order, order_details = [] } = req.body;

//     // ✅ Only validate required fields
//     if (
//       typeof order.total_amount !== 'number' ||
//       typeof order.paid_amount !== 'number' ||
//       !order.payment_method
//     ) {
//       return res.status(400).json({ error: "Missing or invalid order fields" });
//     }

//     if (!order_details.length) {
//       return res.status(400).json({ error: "Order details cannot be empty" });
//     }

//     const order_no = await newOrderNo();

//     const [orderResult] = await db.query(
//       `INSERT INTO \`order\` 
//         (order_no, customer_id, total_amount, paid_amount, payment_method, remark, user_id, create_by) 
//        VALUES 
//         (:order_no, :customer_id, :total_amount, :paid_amount, :payment_method, :remark, :user_id, :create_by)`,
//       {
//         order_no,
//         customer_id: order.customer_id || null, // allow null
//         total_amount: order.total_amount,
//         paid_amount: order.paid_amount,
//         payment_method: order.payment_method,
//         remark: order.remark || "",
//         user_id: req.auth?.id || null,
//         create_by: req.auth?.name || "System",
//       }
//     );

//     const sqlDetail = `INSERT INTO order_detail 
//       (order_id, product_id, qty, price, discount, total)
//       VALUES (:order_id, :product_id, :qty, :price, :discount, :total)`;

//     for (const item of order_details) {
//       await db.query(sqlDetail, {
//         order_id: orderResult.insertId,
//         ...item
//       });

//       if (item.product_id !== 0) {
//         await db.query(`UPDATE product SET qty = qty - :qty WHERE id = :product_id`, {
//           qty: item.qty,
//           product_id: item.product_id
//         });
//       }
//     }

//     const [currentOrder] = await db.query("SELECT * FROM `order` WHERE id = :id", {
//       id: orderResult.insertId
//     });

//     return res.json({
//       order: currentOrder?.[0] || null,
//       order_details,
//       message: "Order created successfully"
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to create order", details: error.message });
//   }
// };


// const newOrderNo = async (req, res) => {
//   try {
//     var sql =
//       "SELECT " +
//       "CONCAT('INV',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM `order`), 3, '0')) " +
//       "as order_no";
//     var [data] = await db.query(sql);
//     return data[0].order_no;
//   } catch (error) {
//     logError("newOrderNo.create", error, res);
//   }
// };

// exports.update = async (req, res) => {
//   try {
//     var sql =
//       "UPDATE  order set name=:name, code=:code, tel=:tel, email=:email, address=:address, website=:website, note=:note WHERE id=:id ";
//     var [data] = await db.query(sql, {
//       ...req.body,
//     });
//     res.json({
//       data: data,
//       message: "Update success!",
//     });
//   } catch (error) {
//     logError("order.update", error, res);
//   }
// };

// exports.remove = async (req, res) => {
//   try {
//     var [data] = await db.query("DELETE FROM order WHERE id = :id", {
//       ...req.body,
//     });
//     res.json({
//       data: data,
//       message: "Data delete success!",
//     });
//   } catch (error) {
//     logError("order.remove", error, res);
//   }
// };
