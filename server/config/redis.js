const Redis = require('ioredis');

const redisConnectionURL = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL || null;

let redis = null;

if (redisConnectionURL) {
  redis = new Redis(redisConnectionURL, {
    family: 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 10) return undefined;
      return Math.min(times * 100, 3000);
    }
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Railway Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
  });

} else if (process.env.REDISHOST) {
  redis = new Redis({
    host: process.env.REDISHOST,
    port: parseInt(process.env.REDISPORT || "6379"),
    password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD,
    username: process.env.REDISUSER || 'default',
    family: 0,
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
  redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
    retryStrategy(times) {
      console.warn('⚠️ Local Redis not found. Set REDIS_URL for production.');
      return null;
    }
  });
}

const getCache = async (key) => {
  try {
    if (!redis || redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const setCache = async (key, value, expiresInSec = 3600) => {
  try {
    if (!redis || redis.status !== 'ready') return;
    await redis.setex(key, expiresInSec, JSON.stringify(value));
  } catch (error) {
  }
};

const clearCache = async (pattern) => {
  try {
    if (!redis || redis.status !== 'ready') return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  clearCache,
  isConnected: () => redis && redis.status === 'ready'
};
