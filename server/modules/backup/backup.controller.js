const { db, logError } = require("../../src/util/helper");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BACKUP_DIR = path.join(__dirname, "../../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Get List of Database Backups
exports.getBackups = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backupList = files
      .filter(f => f.endsWith(".sql"))
      .map((file, idx) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          id: idx.toString(),
          filename: file,
          size_mb: parseFloat(stats.size / (1024 * 1024)).toFixed(2),
          created_at: stats.birthtime
        };
      })
      .sort((a, b) => b.created_at - a.created_at);

    res.json({ list: backupList, success: true });
  } catch (error) {
    logError("backup.getBackups", error, res);
  }
};

// 2. Trigger Database Backup Generation (Actual working mysqldump!)
exports.createBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const dbName = process.env.DB_DATABASE || "coffee_saas";
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASSWORD || "";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 3306;

    const filename = `backup_${dbName}_${Date.now()}.sql`;
    const outputPath = path.join(BACKUP_DIR, filename);

    // Build mysqldump command
    // Under Windows, we wrap password in quotes
    let cmd = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser}`;
    if (dbPass) {
      cmd += ` -p"${dbPass}"`;
    }
    cmd += ` ${dbName} > "${outputPath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("Backup exec error:", error);
        return res.status(500).json({ message: "Failed to generate database dump.", error: error.message });
      }

      res.json({
        success: true,
        message: "Database backup snapshot generated successfully.",
        file: {
          filename,
          size_mb: parseFloat(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2),
          created_at: new Date()
        }
      });
    });
  } catch (error) {
    logError("backup.createBackup", error, res);
  }
};

// 3. Delete a Backup File
exports.deleteBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { filename } = req.body;
    if (!filename) return res.status(400).json({ message: "Filename is required." });

    // Prevent directory traversal attacks
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: "Backup file deleted successfully." });
    } else {
      res.status(404).json({ message: "Backup file not found." });
    }
  } catch (error) {
    logError("backup.deleteBackup", error, res);
  }
};
