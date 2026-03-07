const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const [list] = await db.query("SELECT * FROM roles WHERE business_id = ?", [business_id]);
    res.json({
      list: list,
    });
  } catch (error) {
    logError("role.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    const { name, code } = req.body;
    const sql = "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, code]);
    res.json({
      data: data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("role.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    const { id, name, code } = req.body;
    const [data] = await db.query(
      "UPDATE roles SET name = ?, code = ? WHERE id = ? AND business_id = ?",
      [name, code, id, business_id]
    );
    res.json({
      data: data,
      message: "Data update success!",
    });
  } catch (error) {
    logError("role.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { business_id } = req;
    const { id } = req.body;
    const [data] = await db.query("DELETE FROM roles WHERE id = ? AND business_id = ?", [
      id, business_id
    ]);
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("role.remove", error, res);
  }
};
