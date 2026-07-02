const fs = require('fs');
const path = require('path');
const db = require('../src/util/connection');

async function seed() {
  try {
    console.log('🌱 Starting database seeding against AWS RDS...');
    const sqlFilePath = path.join(__dirname, '../database/POS_Coffee26.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL by semicolon followed by newline, and clean up inline comments
    const statements = sql
      .split(/;[ \t]*[\r\n]+/)
      .map(stmt => {
        return stmt.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('--') && !line.startsWith('#'))
          .join('\n');
      })
      .filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Disable foreign key checks to avoid order conflicts
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Skip comment statements like /*!... */ if they cause syntax issues
        if (stmt.startsWith('/*!') && stmt.endsWith('*/')) {
          continue;
        }
        await db.query(stmt);
      } catch (err) {
        console.error(`Error executing statement #${i + 1}:`, err.message);
        console.error('Statement:', stmt);
        throw err;
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
