const { db, logError } = require("../../src/util/helper");
const { redis } = require("../../src/util/redisClient");
const os = require("os");

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

// 5. Get Server Status Metrics (CPU, RAM, Redis, Database health)
exports.getServerStatus = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    // Database health check
    let dbStatus = "healthy";
    let dbLatency = 0;
    const dbStart = Date.now();
    try {
      await db.query("SELECT 1");
      dbLatency = Date.now() - dbStart;
    } catch (err) {
      dbStatus = "unhealthy";
    }

    // Redis health check
    let redisStatus = "healthy";
    try {
      const { isConnected } = require("../../src/util/redisClient");
      redisStatus = isConnected() ? "healthy" : "disconnected";
    } catch (err) {
      redisStatus = "unhealthy";
    }

    // CPU Usage calculation (simple approximation via load averages)
    const loadAvg = os.loadavg();
    const cpuCores = os.cpus().length;
    const cpuUsagePct = Math.min(100, Math.round((loadAvg[0] / cpuCores) * 100));

    // Memory Usage calculation
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const ramUsagePct = Math.round((usedMemBytes / totalMemBytes) * 100);

    // Process Memory
    const processMem = process.memoryUsage();

    res.json({
      cpu: {
        cores: cpuCores,
        usage_pct: cpuUsagePct,
        load_avg: loadAvg,
        model: os.cpus()[0]?.model || "Unknown Processor"
      },
      ram: {
        total_mb: Math.round(totalMemBytes / (1024 * 1024)),
        used_mb: Math.round(usedMemBytes / (1024 * 1024)),
        free_mb: Math.round(freeMemBytes / (1024 * 1024)),
        usage_pct: ramUsagePct,
        process_rss_mb: Math.round(processMem.rss / (1024 * 1024))
      },
      redis: {
        status: redisStatus
      },
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      os_info: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        arch: os.arch()
      },
      uptime_seconds: Math.round(os.uptime())
    });
  } catch (error) {
    logError("security.getServerStatus", error, res);
  }
};

// 6. Get Active Sessions
exports.getActiveSessions = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    // Query active sessions joining with user and business information
    const [sessions] = await db.query(`
      SELECT 
        s.id, s.token_uuid, s.ip_address, s.user_agent, s.created_at, s.last_activity, s.expires_at,
        u.name as user_name, u.email as user_email,
        r.name as role_name,
        b.name as business_name
      FROM user_sessions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN businesses b ON u.business_id = b.id
      WHERE s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.last_activity DESC
    `);

    res.json({ list: sessions });
  } catch (error) {
    logError("security.getActiveSessions", error, res);
  }
};

// 7. Revoke User Session (Force Logout)
exports.revokeSession = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Access denied." });
    }

    const { token_uuid } = req.body;
    if (!token_uuid) {
      return res.status(400).json({ message: "Session token UUID is required." });
    }

    // Delete session from DB
    await db.query("DELETE FROM user_sessions WHERE token_uuid = ?", [token_uuid]);

    // Set cache status in Redis to false (revoked) so authMiddleware rejects it instantly
    const { setCache } = require("../../src/util/redisClient");
    await setCache(`session_active:${token_uuid}`, 'false', 'EX', 300);

    res.json({ success: true, message: "User session revoked successfully. The user has been logged out." });
  } catch (error) {
    logError("security.revokeSession", error, res);
  }
};
