const { db } = require("./helper");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const BACKUP_DIR = path.join(__dirname, "../../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Core database SQL exporter
const runBackup = async () => {
  const dbName = process.env.DB_DATABASE || "coffee_saas";
  const filename = `backup_${dbName}_${Date.now()}.sql`;
  const outputPath = path.join(BACKUP_DIR, filename);

  // Initialize dump file
  fs.writeFileSync(outputPath, `-- PlatformOS Native Database Dump\n-- Database: ${dbName}\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`);

  // Get all tables
  const [tables] = await db.query("SHOW TABLES");
  
  for (const tableRow of tables) {
    const tableName = Object.values(tableRow)[0];
    
    try {
      // Get Create Table syntax
      const [[createRes]] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSQL = createRes["Create Table"] || createRes["Create View"];
      fs.appendFileSync(outputPath, `DROP TABLE IF EXISTS \`${tableName}\`;\n${createSQL};\n\n`);

      // Get Table Data
      const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const insertStmt = `INSERT INTO \`${tableName}\` VALUES \n`;
        const valuesArray = rows.map(row => {
          const vals = Object.values(row).map(val => {
            if (val === null) return "NULL";
            if (typeof val === "number") return val;
            if (typeof val === "boolean") return val ? 1 : 0;
            if (val instanceof Date) {
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (typeof val === "object") {
              return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
            }
            return `'${val.toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          return `(${vals.join(", ")})`;
        });
        
        fs.appendFileSync(outputPath, `${insertStmt}${valuesArray.join(",\n")};\n\n`);
      }
    } catch (tableErr) {
      console.warn(`Skipped table ${tableName}:`, tableErr.message);
    }
  }

  fs.appendFileSync(outputPath, `SET FOREIGN_KEY_CHECKS=1;\n`);

  const fileStats = fs.statSync(outputPath);

  // ── Trigger Cloud S3 Upload if Enabled ──────────────────────────────────────
  try {
    const [settings] = await db.query(
      "SELECT sett_key, sett_value FROM system_settings WHERE sett_key IN ('backup_s3_enabled', 'backup_s3_provider', 'backup_s3_access_key', 'backup_s3_secret_key', 'backup_s3_region', 'backup_s3_bucket', 'backup_s3_endpoint')"
    );

    const s3Conf = {};
    settings.forEach(s => {
      s3Conf[s.sett_key] = s.sett_value;
    });

    if (s3Conf.backup_s3_enabled === "true") {
      console.log(`[CloudBackup] Starting S3 upload to bucket: ${s3Conf.backup_s3_bucket}...`);
      
      const s3ClientConfig = {
        region: s3Conf.backup_s3_region || "us-east-1",
        credentials: {
          accessKeyId: s3Conf.backup_s3_access_key,
          secretAccessKey: s3Conf.backup_s3_secret_key
        }
      };

      if (s3Conf.backup_s3_provider !== "aws" && s3Conf.backup_s3_endpoint) {
        let endpointUrl = s3Conf.backup_s3_endpoint;
        if (!endpointUrl.startsWith("http://") && !endpointUrl.startsWith("https://")) {
          endpointUrl = `https://${endpointUrl}`;
        }
        s3ClientConfig.endpoint = endpointUrl;
      }

      const s3Client = new S3Client(s3ClientConfig);
      const fileContent = fs.readFileSync(outputPath);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Conf.backup_s3_bucket,
          Key: filename,
          Body: fileContent
        })
      );
      console.log(`[CloudBackup] Successfully uploaded backup ${filename} to S3 bucket ${s3Conf.backup_s3_bucket}.`);
    }
  } catch (s3Err) {
    console.error("[CloudBackup] S3 Upload Failed:", s3Err.message);
    // We do not throw the error so the local backup is still considered successful
  }

  return {
    filename,
    size_bytes: fileStats.size,
    created_at: new Date()
  };
};

// 2. Clean old backups older than retentionDays
const cleanOldBackups = (retentionDays) => {
  if (!retentionDays || isNaN(retentionDays)) return;
  const files = fs.readdirSync(BACKUP_DIR);
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    if (file.endsWith(".sql")) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.birthtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`[AutoBackup] Cleaned up old backup file: ${file}`);
      }
    }
  });
};

module.exports = {
  runBackup,
  cleanOldBackups,
  BACKUP_DIR
};
