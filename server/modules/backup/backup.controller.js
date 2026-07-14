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

// 2. Trigger Database Backup Generation (Native JS Database Exporter)
exports.createBackup = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const dbName = process.env.DB_DATABASE || "coffee_saas";
    const filename = `backup_${dbName}_${Date.now()}.sql`;
    const outputPath = path.join(BACKUP_DIR, filename);

    // Initialize dump file
    fs.writeFileSync(outputPath, `-- PlatformOS Native Database Dump\n-- Database: ${dbName}\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`);

    // 1. Get all tables
    const [tables] = await db.query("SHOW TABLES");
    
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      
      try {
        // 2. Get Create Table syntax
        const [[createRes]] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createSQL = createRes["Create Table"] || createRes["Create View"];
        fs.appendFileSync(outputPath, `DROP TABLE IF EXISTS \`${tableName}\`;\n${createSQL};\n\n`);

        // 3. Get Table Data
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

    res.json({
      success: true,
      message: "Database backup snapshot generated successfully.",
      file: {
        filename,
        size_bytes: fs.statSync(outputPath).size,
        created_at: new Date()
      }
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
