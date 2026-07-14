const { db } = require("./helper");
const fs = require("fs");
const path = require("path");

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

  return {
    filename,
    size_bytes: fs.statSync(outputPath).size,
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
