const { db, logError } = require("../../src/util/helper");

exports.getNotifications = async (req, res) => {
  try {
    const { business_id } = req;

    // Auto-check subscription expiry if business_id is not null and not Platform Owner (ID 1)
    if (business_id && business_id !== 1) {
      const [subs] = await db.query(
        "SELECT end_date, DATEDIFF(end_date, NOW()) as days_remaining FROM subscriptions WHERE business_id = ? AND status = 'active' AND end_date IS NOT NULL ORDER BY end_date DESC LIMIT 1",
        [business_id]
      );
      if (subs.length > 0) {
        const { days_remaining } = subs[0];
        if (days_remaining <= 7) {
          // Check if notification already exists for this business
          const [exist] = await db.query(
            "SELECT id FROM system_notifications WHERE business_id = ? AND type = 'subscription' AND message LIKE '%expire%' AND created_at >= NOW() - INTERVAL 3 DAY",
            [business_id]
          );
          if (exist.length === 0) {
            const daysText = days_remaining <= 0 ? "expired today / បានហួសកំណត់ថ្ងៃនេះ" : `will expire in ${days_remaining} days / នឹងហួសកំណត់ក្នុងរយៈពេល ${days_remaining} ថ្ងៃ`;
            await db.query(
              "INSERT INTO system_notifications (business_id, title, message, type) VALUES (?, ?, ?, 'subscription')",
              [
                business_id,
                "Subscription Expiring Alert / ការព្រមានគម្រោងជិតហួសកំណត់",
                `Your subscription package ${daysText}. Please renew or upgrade your plan to prevent service interruption.`
              ]
            );
          }
        }
      }
    }
    
    let sql = "";
    let params = [];

    if (business_id === 1) {
      // Platform Owner gets all notifications
      sql = `
        SELECT n.*, b.name as business_name 
        FROM system_notifications n 
        LEFT JOIN businesses b ON n.business_id = b.id 
        ORDER BY n.created_at DESC
      `;
    } else {
      // Regular business gets global + their own
      sql = `
        SELECT * 
        FROM system_notifications 
        WHERE business_id IS NULL OR business_id = ? 
        ORDER BY created_at DESC
      `;
      params.push(business_id);
    }

    const [rows] = await db.query(sql, params);
    res.json({ list: rows });
  } catch (error) {
    logError("notification.getNotifications", error, res);
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { business_id } = req;
    const { title, message, type, target_business_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    // Set business_id target:
    // If user is Platform Owner (business_id === 1), they can choose target_business_id.
    // If not, it will be their own business_id.
    let final_business_id = business_id;
    if (business_id === 1) {
      final_business_id = target_business_id === "all" ? null : target_business_id;
    }

    await db.query(
      "INSERT INTO system_notifications (business_id, title, message, type) VALUES (?, ?, ?, ?)",
      [final_business_id, title, message, type || 'system']
    );

    res.json({ success: true, message: "Notification created successfully" });
  } catch (error) {
    logError("notification.createNotification", error, res);
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id } = req;

    let sql = "UPDATE system_notifications SET is_read = 1 WHERE id = ?";
    let params = [id];

    if (business_id !== 1) {
      sql += " AND (business_id = ? OR business_id IS NULL)";
      params.push(business_id);
    }

    await db.query(sql, params);
    res.json({ success: true });
  } catch (error) {
    logError("notification.markRead", error, res);
  }
};

exports.markReadAll = async (req, res) => {
  try {
    const { business_id } = req;

    let sql = "UPDATE system_notifications SET is_read = 1";
    let params = [];

    if (business_id !== 1) {
      sql += " WHERE business_id = ? OR business_id IS NULL";
      params.push(business_id);
    }

    await db.query(sql, params);
    res.json({ success: true });
  } catch (error) {
    logError("notification.markReadAll", error, res);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id } = req;

    let sql = "DELETE FROM system_notifications WHERE id = ?";
    let params = [id];

    if (business_id !== 1) {
      sql += " AND (business_id = ? OR business_id IS NULL)";
      params.push(business_id);
    }

    await db.query(sql, params);
    res.json({ success: true });
  } catch (error) {
    logError("notification.deleteNotification", error, res);
  }
};


// Composite extensions added during modular migration
const t = require("./telegram.controller");
module.exports = {
  ...module.exports,
  ...t,
  getList: module.exports.getNotifications,
  create: module.exports.createNotification,
  readAll: module.exports.markReadAll,
  markRead: module.exports.markRead,
  remove: module.exports.deleteNotification,
  handleWebhook: t.handleWebhook
};
