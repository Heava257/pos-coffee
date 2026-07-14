const mysql = require('mysql2/promise');
const config = require('./config');

/**
 * M-5 FIX: Connection pool with explicit timeouts and bounded queue.
 * - connectTimeout: fail fast if DB is unreachable.
 * - queueLimit: bounded at 200 — rejects gracefully instead of growing unbounded in memory.
 * - connectionLimit: 20 is realistic for a single Node process; increase if scaling horizontally.
 */
const pool = mysql.createPool({
  host:     config.db.HOST,
  user:     config.db.USER,
  password: config.db.PASSWORD,
  database: config.db.DATABASE,
  port:     config.db.PORT,
  ssl:      config.db.SSL ? { rejectUnauthorized: false } : undefined,
  timezone: 'Z',
  charset:  'utf8mb4',
  namedPlaceholders:  true,
  waitForConnections: true,
  connectionLimit: 20,   // sufficient for a single-node app
  queueLimit:      200,  // bounded — reject beyond this with a clear error
  connectTimeout:  10000, // 10 s — fail fast if DB is unreachable
});

// Optional: log a warning when queue is under pressure
pool.on('connection', () => {});

module.exports = pool;
