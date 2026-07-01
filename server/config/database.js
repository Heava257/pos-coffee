const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.APP_ENV === 'production' ? process.env.DB_PROD_HOST : (process.env.DB_HOST || "localhost"),
  user: process.env.APP_ENV === 'production' ? process.env.DB_PROD_USER : (process.env.DB_USER || "dev_user"),
  password: process.env.APP_ENV === 'production' ? process.env.DB_PROD_PASSWORD : (process.env.DB_PASSWORD || "88889999"),
  database: process.env.APP_ENV === 'production' ? process.env.DB_PROD_DATABASE : (process.env.DB_DATABASE || "coffee_saas"),
  port: process.env.APP_ENV === 'production' ? process.env.DB_PROD_PORT : (process.env.DB_PORT || 3306),
  timezone: 'Z',
  charset: 'utf8mb4',
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
