const Redis = require('ioredis');

// Connect matching Railway environment variables.
// If not deployed, it falls back to local Redis (127.0.0.1:6379)
const redisConnectionURL = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL || null;

let redis = null;

if (redisConnectionURL) {
  // Use connection URL provided by Railway
  redis = new Redis(redisConnectionURL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 10) return undefined; // Stop retrying after 10 attempts
      return Math.min(times * 100, 3000); // Reconnect with a delay
    }
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Railway Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
  });

} else if (process.env.REDISHOST) {
  // Use individual Railway variables if REDIS_URL is somehow missing but others are present
  redis = new Redis({
    host: process.env.REDISHOST,
    port: parseInt(process.env.REDISPORT || "6379"),
    password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD,
    username: process.env.REDISUSER || 'default',
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 10) return undefined;
      return Math.min(times * 100, 3000);
    }
  });

  redis.on('connect', () => {
    console.log(`✅ Connected to Railway Redis at ${process.env.REDISHOST}`);
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
  });

} else {
  // Fallback to local Redis
  // Ensure you have Redis installed locally if you want to use it in Localhost development
  redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
    retryStrategy(times) {
      // Don't spam retries locally if dev doesn't have Redis installed
      console.warn('⚠️ Local Redis not found. Set REDIS_URL for production.');
      return null;
    }
  });
}

// Global caching helper
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Redis Get Error:", error);
    return null;
  }
};

const setCache = async (key, value, expiresInSec = 3600) => {
  if (!redis) return;
  try {
    await redis.setex(key, expiresInSec, JSON.stringify(value));
  } catch (error) {
    console.error("Redis Set Error:", error);
  }
};

const clearCache = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis Clear Error:", error);
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  clearCache
};
