const customerController = require("../../src/controller/customer.controller");
const db = require("../../config/database");

module.exports = {
  ...customerController,
  getMembershipTiers: async (req, res) => {
    try {
      const { business_id } = req;
      const [list] = await db.query(
        "SELECT * FROM membership_tiers WHERE business_id = ? ORDER BY min_points ASC",
        [business_id]
      );
      res.json({ list });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createMembershipTier: async (req, res) => {
    try {
      const { business_id } = req;
      const { name, min_points, discount_rate } = req.body;
      const [result] = await db.query(
        "INSERT INTO membership_tiers (business_id, name, min_points, discount_rate) VALUES (?, ?, ?, ?)",
        [business_id, name, min_points, discount_rate]
      );
      res.json({ success: true, message: "Membership tier created successfully!", id: result.insertId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateMembershipTier: async (req, res) => {
    try {
      const { business_id } = req;
      const { id, name, min_points, discount_rate } = req.body;
      await db.query(
        "UPDATE membership_tiers SET name = ?, min_points = ?, discount_rate = ? WHERE id = ? AND business_id = ?",
        [name, min_points, discount_rate, id, business_id]
      );
      res.json({ success: true, message: "Membership tier updated successfully!" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};