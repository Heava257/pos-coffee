const cron = require("node-cron");
const { db } = require("../src/util/helper");

/**
 * Platform Audit Logs Auto-Cleanup Job
 * Runs daily at 01:30 AM (server time)
 * - Fetches retention settings from system_settings
 * - Removes logs older than the specified retention days (default: 90 days)
 */
const start = () => {
  // Run daily at 01:30 AM
  cron.schedule("30 1 * * *", async () => {
    console.log("[AutoCleanup] Running automated audit logs pruning...");
    try {
      // 1. Fetch settings from DB
      const [rows] = await db.query(
        "SELECT sett_key, sett_value FROM system_settings WHERE sett_key IN ('audit_logs_cleanup_enabled', 'audit_logs_retention_days')"
      );

      let enabled = "true";
      let retentionDays = 90;

      rows.forEach(row => {
        if (row.sett_key === "audit_logs_cleanup_enabled") enabled = row.sett_value;
        if (row.sett_key === "audit_logs_retention_days") retentionDays = parseInt(row.sett_value) || 90;
      });

      if (enabled !== "true") {
        console.log("[AutoCleanup] Automated audit logs cleanup is disabled in settings.");
        return;
      }

      console.log(`[AutoCleanup] Pruning audit logs older than ${retentionDays} days...`);

      // 2. Perform deletion
      const [res] = await db.query(
        "DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
        [retentionDays]
      );

      console.log(`[AutoCleanup] Successfully pruned ${res.affectedRows} audit log entry(ies).`);
    } catch (error) {
      console.error("[AutoCleanup ERROR] Audit logs pruning failed:", error.message);
    }
  });
  console.log("[AutoCleanup] Audit logs pruning scheduler started. Runs daily at 01:30 AM.");
};

module.exports = { start };
