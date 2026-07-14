const { db } = require('../src/util/helper');
const { getCache, setCache } = require('../src/util/redisClient');
const { logSecurityEvent } = require('../src/util/securityLogger');

/**
 * IP Blacklist Middleware — Blocks blacklisted IPs at the HTTP gateway level.
 * - Uses Redis cache to optimize checks and avoid database lookups on every request.
 */
const ipBlacklistMiddleware = async (req, res, next) => {
  const clientIp = req.ip;

  // Skip blacklist check for localhost/loopback in dev if needed,
  // but keep it for completeness.
  const cacheKey = `blocked_ip:${clientIp}`;

  try {
    const isCachedBlocked = await getCache(cacheKey);

    if (isCachedBlocked === 'true') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. Your IP has been blocked for security reasons.'
      });
    } else if (isCachedBlocked === 'false') {
      return next();
    }

    // Check DB blocked_ips table
    const [rows] = await db.query("SELECT ip, reason FROM blocked_ips WHERE ip = ?", [clientIp]);

    if (rows.length > 0) {
      // Cache blocked status for 5 minutes (300 seconds)
      await setCache(cacheKey, 'true', 'EX', 300);
      
      // Log the blocked attempt
      logSecurityEvent(clientIp, 'blocked_ip_access_attempt', req.originalUrl, req.headers['user-agent'], { reason: rows[0].reason });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. Your IP has been blocked for security reasons.'
      });
    }

    // Cache clean status for 1 minute (60 seconds)
    await setCache(cacheKey, 'false', 'EX', 60);
    next();
  } catch (err) {
    // Fail open if Redis or DB is unreachable, but log the error locally
    console.error(`[IP Blacklist Check Error]:`, err.message);
    next();
  }
};

module.exports = ipBlacklistMiddleware;
