const customerController = require("../../src/controller/customer.controller");
const db = require("../../config/database");

module.exports = {
  ...customerController,
  redeemStars: customerController.redeemReward,
  getRedeemHistory: async (req, res) => {
    try {
      const { business_id } = req;
      const { customer_id } = req.query;
      let sql = "SELECT r.*, c.name as customer_name FROM customer_redeems r JOIN customers c ON r.customer_id = c.id WHERE r.business_id = ?";
      let params = [business_id];
      if (customer_id) {
        sql += " AND r.customer_id = ?";
        params.push(customer_id);
      }
      sql += " ORDER BY r.redeemed_at DESC";
      const [list] = await db.query(sql, params);
      res.json({ list });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  checkStars: async (req, res) => {
    try {
      const { customer_id } = req.query;
      const [rows] = await db.query("SELECT points FROM customers WHERE id = ?", [customer_id]);
      if (rows.length > 0) {
        res.json({ points: rows[0].points });
      } else {
        res.status(404).json({ message: "Customer not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};