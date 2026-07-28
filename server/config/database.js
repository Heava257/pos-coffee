const mysql = require("mysql2/promise");

const requireEnv = (key, devDefault) => {
  const val = process.env[key];
  if (!val) {
    if (process.env.APP_ENV === 'production') {
      throw new Error(`[CONFIG] Missing critical production environment variable: ${key}.`);
    }
    if (devDefault !== undefined) return devDefault;
    throw new Error(`[CONFIG] Missing required environment variable: ${key}. Set it in your .env file.`);
  }
  return val;
};

const isProd = process.env.APP_ENV === 'production';

const dbConfig = {
  host:     isProd ? requireEnv('DB_PROD_HOST')     : (process.env.DB_HOST     || "localhost"),
  user:     isProd ? requireEnv('DB_PROD_USER')     : (process.env.DB_USER     || "root"),
  password: isProd ? requireEnv('DB_PROD_PASSWORD') : requireEnv('DB_PASSWORD'),
  database: isProd ? requireEnv('DB_PROD_DATABASE') : (process.env.DB_DATABASE || "coffee_saas"),
  port:     isProd ? (process.env.DB_PROD_PORT || 3306) : (Number(process.env.DB_PORT) || 3306),
  timezone: 'Z',
  charset: 'utf8mb4',
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;

