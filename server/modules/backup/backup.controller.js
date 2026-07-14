const { logError } = require("../../src/util/helper");
const fs = require("fs");
const path = require("path");
const { runBackup, BACKUP_DIR } = require("../../src/util/backupExporter");

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
          size_bytes: stats.size,
          created_at: stats.birthtime
        };
      })
      .sort((a, b) => b.created_at - a.created_at);

    res.json({ list: backupList, success: true });
  } catch (error) {
    logError("backup.getBackups", error, res);
  }
};

// 2. Trigger Database Backup Generation
exports.createBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const backupFile = await runBackup();

    res.json({
      success: true,
      message: "Database backup snapshot generated successfully.",
      file: backupFile
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
