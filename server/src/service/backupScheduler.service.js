const cron = require("node-cron");
const { db } = require("../util/helper");
const { runBackup, cleanOldBackups } = require("../util/backupExporter");

let activeCronTask = null;

const getBackupSettings = async () => {
  try {
    const [rows] = await db.query(
      "SELECT sett_key, sett_value FROM system_settings WHERE sett_key IN ('backup_schedule_enabled', 'backup_schedule_cron', 'backup_schedule_retention_days')"
    );
    const settings = {
      enabled: "false",
      cron: "0 2 * * *", // default: daily at 2:00 AM
      retentionDays: "30"
    };

    rows.forEach(row => {
      if (row.sett_key === "backup_schedule_enabled") settings.enabled = row.sett_value;
      if (row.sett_key === "backup_schedule_cron") settings.cron = row.sett_value || "0 2 * * *";
      if (row.sett_key === "backup_schedule_retention_days") settings.retentionDays = row.sett_value || "30";
    });

    return settings;
  } catch (err) {
    console.error("[AutoBackup] Failed to fetch settings from DB:", err.message);
    return { enabled: "false", cron: "0 2 * * *", retentionDays: "30" };
  }
};

const start = async () => {
  // If a task is already running, stop it first
  if (activeCronTask) {
    activeCronTask.stop();
    activeCronTask = null;
  }

  const settings = await getBackupSettings();

  if (settings.enabled !== "true") {
    console.log("[AutoBackup] Automated schedule is disabled in system settings.");
    return;
  }

  const cronPattern = settings.cron;
  const retention = parseInt(settings.retentionDays) || 30;

  // Validate cron pattern before scheduling
  if (!cron.validate(cronPattern)) {
    console.error(`[AutoBackup] Invalid cron pattern: "${cronPattern}". Scheduler not started.`);
    return;
  }

  console.log(`[AutoBackup] Scheduling automated backups: "${cronPattern}" (Retention: ${retention} days).`);

  activeCronTask = cron.schedule(cronPattern, async () => {
    console.log("[AutoBackup] Starting automated database backup snapshot...");
    try {
      const backupFile = await runBackup();
      console.log(`[AutoBackup] Snapshot backup completed successfully: ${backupFile.filename} (${(backupFile.size_bytes / 1024).toFixed(2)} KB).`);
      
      // Run retention cleanup
      cleanOldBackups(retention);
    } catch (err) {
      console.error("[AutoBackup] Automated backup failed:", err.message);
    }
  });
};

const reload = async () => {
  console.log("[AutoBackup] Reloading backup scheduler settings...");
  await start();
};

module.exports = {
  start,
  reload
};
