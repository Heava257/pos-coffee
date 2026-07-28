const { logError } = require("../../src/util/helper");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const { runBackup, BACKUP_DIR } = require("../../src/util/backupExporter");

// 1. Get List of Database and File Backups
exports.getBackups = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backupList = files
      .filter(f => f.endsWith(".sql") || f.endsWith(".tar.gz"))
      .map((file, idx) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          id: idx.toString(),
          filename: file,
          type: file.endsWith(".sql") ? "db" : "files",
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

// 2. Trigger Database or File Backup Generation
exports.createBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { type } = req.body; // 'db' or 'files'

    if (type === "files") {
      console.log("[Backup] Starting File Backup (public/images)...");
      const filename = `backup_files_${Date.now()}.tar.gz`;
      const outputPath = path.join(BACKUP_DIR, filename);
      const uploadDir = path.resolve(__dirname, "../../public/images");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create tarball of uploads
      const cmd = `tar -czf "${outputPath}" -C "${uploadDir}" .`;
      await execPromise(cmd);

      const stats = fs.statSync(outputPath);
      console.log(`[Backup] File backup generated successfully: ${filename}`);

      res.json({
        success: true,
        message: "File backup snapshot generated successfully.",
        file: {
          filename,
          type: "files",
          size_bytes: stats.size,
          created_at: new Date()
        }
      });
    } else {
      // Default to database backup
      console.log("[Backup] Starting Database Backup...");
      const backupFile = await runBackup();
      
      res.json({
        success: true,
        message: "Database backup snapshot generated successfully.",
        file: {
          ...backupFile,
          type: "db"
        }
      });
    }
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

// 4. Test S3 Connection Handshake
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

exports.testS3Connection = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { provider, accessKey, secretKey, region, bucket, endpoint } = req.body;

    if (!accessKey || !secretKey || !bucket) {
      return res.status(400).json({ success: false, message: "Access Key, Secret Key, and Bucket Name are required." });
    }

    const s3Config = {
      region: region || "us-east-1",
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      }
    };

    if (provider !== "aws" && endpoint) {
      let endpointUrl = endpoint;
      if (!endpointUrl.startsWith("http://") && !endpointUrl.startsWith("https://")) {
        endpointUrl = `https://${endpointUrl}`;
      }
      s3Config.endpoint = endpointUrl;
    }

    const s3Client = new S3Client(s3Config);
    
    await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1
      })
    );

    res.json({ success: true, message: "S3 connection test successful! Handshake established." });
  } catch (error) {
    console.error("[S3 Test Connection Error]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to establish S3 connection." });
  }
};

// 5. Download Backup File
exports.downloadBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { filename } = req.params;
    if (!filename) return res.status(400).json({ message: "Filename is required." });

    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);

    if (fs.existsSync(filePath)) {
      res.download(filePath, safeName);
    } else {
      res.status(404).json({ message: "Backup file not found." });
    }
  } catch (error) {
    logError("backup.downloadBackup", error, res);
  }
};

// 6. Restore System Snapshot (Database or File)
exports.restoreBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { filename } = req.body;
    if (!filename) return res.status(400).json({ message: "Filename is required." });

    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found." });
    }

    if (safeName.endsWith(".sql")) {
      console.log(`[Restore] Restoring database from SQL snapshot: ${safeName}...`);
      const sqlContent = fs.readFileSync(filePath, "utf8");
      
      // Split by semicolons followed by newlines
      const statements = sqlContent
        .split(/;\r?\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

      const pool = require("../../src/util/connection");
      const connection = await pool.getConnection();
      try {
        await connection.query("SET FOREIGN_KEY_CHECKS=0;");
        for (const stmt of statements) {
          if (stmt) {
            await connection.query(stmt);
          }
        }
        await connection.query("SET FOREIGN_KEY_CHECKS=1;");
      } finally {
        connection.release();
      }

      console.log(`[Restore] Database successfully restored from ${safeName}.`);
      return res.json({ success: true, message: "Database successfully restored from snapshot." });

    } else if (safeName.endsWith(".tar.gz")) {
      console.log(`[Restore] Restoring uploaded files from tarball: ${safeName}...`);
      const uploadDir = path.resolve(__dirname, "../../public/images");
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Extract archive command
      const cmd = `tar -xzf "${filePath}" -C "${uploadDir}"`;
      await execPromise(cmd);

      console.log(`[Restore] Uploaded files successfully restored from ${safeName}.`);
      return res.json({ success: true, message: "Uploaded files successfully restored." });
    } else {
      return res.status(400).json({ message: "Unsupported backup file type." });
    }

  } catch (error) {
    logError("backup.restoreBackup", error, res);
  }
};
