const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;
    let sql = `
      SELECT id, name, 
        CASE WHEN gender = 1 THEN 'Male' ELSE 'Female' END AS gender,
        position, salary, tel, email, address, create_at
      FROM employee 
      WHERE business_id = ?
    `;

    if (!isEmpty(txtSearch)) {
      sql += " AND (name LIKE ? OR tel LIKE ? OR email LIKE ?)";
    }

    const [list] = await db.query(sql, [
      business_id,
      `%${txtSearch}%`, `%${txtSearch}%`, `%${txtSearch}%`
    ]);

    res.json({
      list,
    });
  } catch (error) {
    logError("employee.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name, position, salary, gender, tel, email, address
    } = req.body;
    const { business_id, branch_id } = req;

    // Convert gender from "Male"/"Female" to 1/0
    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      INSERT INTO employee 
        (business_id, branch_id, name, position, salary, gender, tel, email, address, create_at) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [data] = await db.query(sql, [
      business_id, branch_id, name, position, salary, genderValue, tel, email, address
    ]);

    res.json({
      data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("employee.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      id, name, position, salary, gender, tel, email, address
    } = req.body;
    const { business_id } = req;

    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      UPDATE employee 
      SET 
        name = ?, position = ?, salary = ?, gender = ?, tel = ?, email = ?, address = ?
      WHERE id = ? AND business_id = ?
    `;

    const [data] = await db.query(sql, [
      name, position, salary, genderValue, tel, email, address, id, business_id
    ]);

    res.json({
      data,
      message: "Update success!",
    });
  } catch (error) {
    logError("employee.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    const [data] = await db.query("DELETE FROM employee WHERE id = ? AND business_id = ?", [
      id, business_id
    ]);

    res.json({
      data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("employee.remove", error, res);
  }
};
exports.getPerformance = async (req, res) => {
  try {
    const { business_id, branch_id } = req;
    const { from_date, to_date } = req.query;

    const sql = `
      SELECT 
        u.id as user_id,
        u.name as staff_name,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(od.qty) as total_items,
        SUM(o.total_amount) as total_sales,
        SUM(od.qty) * 0.05 as commission_earned
      FROM users u
      JOIN orders o ON u.id = o.user_id
      JOIN order_details od ON o.id = od.order_id
      WHERE o.business_id = ? 
      ${branch_id ? 'AND o.branch_id = ?' : ''}
      ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}
      AND o.status != 'cancelled'
      GROUP BY u.id
      ORDER BY total_sales DESC
    `;

    const params = [business_id];
    if (branch_id) params.push(branch_id);
    if (from_date && to_date) params.push(from_date, to_date);

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("employee.getPerformance", error, res);
  }
};
