// Trigger Nodemon Reload to clear in-memory MockRedis permissions cache
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');           // H-4 FIX: security headers
const xssClean = require('xss-clean');     // L-2 FIX: sanitize XSS payloads
const telegramPolling = require('./src/service/telegramPolling.service');
telegramPolling.start();

const backupScheduler = require('./src/service/backupScheduler.service');
backupScheduler.start();

const app = express();

// â”€â”€â”€ Security Middleware (order matters) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// H-4 FIX: Helmet sets essential HTTP security headers
// (X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin images (Cloudinary)
  contentSecurityPolicy: false, // Disable CSP here if you need script flexibility; harden later
}));

// H-3 FIX: Restrict CORS to known allowed origins â€” never use "*" in production.
// Set ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com in .env
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed.`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// IP Blacklist check middleware (blocks malicious IPs at entry level)
const ipBlacklistMiddleware = require('./middlewares/ipBlacklist.middleware');
app.use(ipBlacklistMiddleware);

// L-2 FIX: xss-clean strips HTML/script tags from req.body, req.query, req.params
app.use(xssClean());

app.use(express.json({ limit: '10mb' }));           // tightened from 50mb
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use('/public', express.static('public', {
  setHeaders: (res, path) => {
    if (path.includes('images') && !path.includes('.')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));

app.get("/api/ping", (req, res) => res.json({ status: "ok", time: new Date() }));
app.get("/api/redis-test", async (req, res) => {
  try {
    const { redis } = require("./src/util/redisClient");
    if (!redis) return res.json({ status: "error", message: "Redis Config Missing or Not Initialized" });
    await redis.set("test_key", "Hello from Redis!", "EX", 60);
    const value = await redis.get("test_key");
    res.json({ status: "ok", connected: true, value, message: "Redis is working perfectly!" });
  } catch (err) {
    res.json({ status: "error", connected: false, message: err.message });
  }
});

// Mount modularized API V1 routes
app.use("/api/v1", require("./routes"));
app.use("/api", require("./routes"));


app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }

  // C-5 FIX: Log full error server-side, but return ONLY a safe message to the client
  const { randomUUID } = require('crypto');
  const errorId = randomUUID();
  console.error(`ðŸ”¥ [GlobalError:${errorId}]`, err.message);

  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      error_id: errorId, // share this ID with support for log lookup
    });
  }
});


const http = require('http');
const server = http.createServer({
  maxHeaderSize: 65536, // 64KB
  headersTimeout: 120000, // 2 minutes
  keepAliveTimeout: 120000, // 2 minutes
}, app);


const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`\u2705 Server running on port ${PORT}`);

  // â”€â”€ Cron Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const { startSubscriptionCron } = require('./src/util/cron');
    startSubscriptionCron();
    require('./jobs/membershipExpire.job').start();
    require('./jobs/stockForecast.job').start();
    require('./jobs/salesSummary.job').start();
    require('./jobs/telegram.job').start();
    require('./jobs/emailPayment.job').start();
    console.log('\u2728 All background jobs registered.');
  } catch (jobErr) {
    console.error('Failed to start background jobs:', jobErr.message);
  }

  // â”€â”€ C-3 FIX: Migrations run via a dedicated module, not inline â”€â”€
  // Keeps index.js clean and prevents accidental privilege escalation on every boot.
  // IMPORTANT: The "EMERGENCY FIX" UPDATE statements (lines that set is_super_admin=1)
  // have been intentionally removed. Use the DB directly for one-time admin fixes.
  try {
    const { runMigrations } = require('./scripts/migrate');
    await runMigrations();
    console.log('\u2705 Migrations complete.');
  } catch (migErr) {
    console.error('\u274c Migration Error:', migErr.message);
  }
});

// Force restart for environment variables when .env changes

