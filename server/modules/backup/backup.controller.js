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

// 4. Test S3 Connection Handshake
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

exports.testS3Connection = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { provider, accessKey, secretKey, region, bucket, endpoint } = req.body;

    if (!accessKey || !secretKey || !bucket) {
      return res.status(400).json({ success: false, message: "Access Key, Secret Key, and Bucket Name are required for handshake." });
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
    
    // List 1 object to test connection and credentials permissions
    await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1
      })
    );

    res.json({ success: true, message: "S3 connection test successful! Handshake established with bucket." });
  } catch (error) {
    console.error("[S3 Test Connection Error]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to establish handshake with S3 bucket." });
  }
};
