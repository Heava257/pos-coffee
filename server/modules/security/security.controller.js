const { db, logError } = require("../../src/util/helper");
const { redis } = require("../../src/util/redisClient");

// 1. Get Security Logs
exports.getLogs = async (req, res) => {
  try {
    // Only Platform Admin (business_id = 1) can view security logs
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [logs] = await db.query(
      "SELECT * FROM security_logs ORDER BY id DESC LIMIT ? OFFSET ?",
      [parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM security_logs");

    res.json({ list: logs, total });
  } catch (error) {
    logError("security.getLogs", error, res);
  }
};

// 2. Get Blocked IPs
exports.getBlockedIps = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    const [ips] = await db.query("SELECT * FROM blocked_ips ORDER BY id DESC");
    res.json({ list: ips });
  } catch (error) {
    logError("security.getBlockedIps", error, res);
  }
};

// 3. Block an IP
exports.blockIp = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ message: "IP address is required." });

    await db.query(
      "INSERT INTO blocked_ips (ip, reason, blocked_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason = ?, blocked_by = ?",
      [ip, reason || "Manual block", req.user_id, reason || "Manual block", req.user_id]
    );

    // Invalidate Redis cache for this IP
    const { setCache } = require("../../src/util/redisClient");
    await setCache(`blocked_ip:${ip}`, 'true', 'EX', 300);

    res.json({ success: true, message: `IP ${ip} has been blocked.` });
  } catch (error) {
    logError("security.blockIp", error, res);
  }
};

// 4. Unblock an IP
exports.unblockIp = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    const { ip } = req.body;
    if (!ip) return res.status(400).json({ message: "IP address is required." });

    await db.query("DELETE FROM blocked_ips WHERE ip = ?", [ip]);

    // Invalidate Redis cache for this IP
    const { setCache } = require("../../src/util/redisClient");
    await setCache(`blocked_ip:${ip}`, 'false', 'EX', 60);

    res.json({ success: true, message: `IP ${ip} has been unblocked.` });
  } catch (error) {
    logError("security.unblockIp", error, res);
  }
};
