const { db, logError } = require("../../src/util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;

    let params = [business_id];
    let sql = "SELECT * FROM suppliers WHERE business_id = ?";

    if (txtSearch) {
      sql += " AND (name LIKE ? OR tel LIKE ? OR code LIKE ?)";
      params.push(`%${txtSearch}%`, `%${txtSearch}%`, `%${txtSearch}%`);
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("supplier.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    const { name, code, tel, email, address, website, note } = req.body;

    const sql = "INSERT INTO suppliers (business_id, name, code, tel, email, address, website, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [business_id, name, code, tel, email, address, website, note]);

    const [newRows] = await db.query("SELECT * FROM suppliers WHERE id = ?", [result.insertId]);

    res.json({
      success: true,
      message: "Supplier added successfully!",
      data: newRows[0]
    });
  } catch (error) {
    logError("supplier.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    const { id, name, code, tel, email, address, website, note } = req.body;

    const sql = "UPDATE suppliers SET name = ?, code = ?, tel = ?, email = ?, address = ?, website = ?, note = ? WHERE id = ? AND business_id = ?";
    await db.query(sql, [name, code, tel, email, address, website, note, id, business_id]);

    const [updatedRows] = await db.query("SELECT * FROM suppliers WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Supplier updated successfully!",
      data: updatedRows[0]
    });
  } catch (error) {
    logError("supplier.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    await db.query("DELETE FROM suppliers WHERE id = ? AND business_id = ?", [id, business_id]);
    res.json({ message: "Supplier removed successfully!" });
  } catch (error) {
    logError("supplier.remove", error, res);
  }
};
