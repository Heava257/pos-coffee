const Redis = require('ioredis');

// Connect matching production Redis environment variables.
// If not deployed, it falls back to local Redis (127.0.0.1:6379)
const redisConnectionURL = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL || null;

let redis = null;

if (redisConnectionURL) {
  // Use connection URL provided by environment
  redis = new Redis(redisConnectionURL, {
    family: 0, // Auto-detect IPv4/IPv6
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 10) return undefined; // Stop retrying after 10 attempts
      return Math.min(times * 100, 3000); // Reconnect with a delay
    }
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
  });

} else if (process.env.REDISHOST) {
  // Use individual Redis environment variables if REDIS_URL is missing but host is present
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
    console.log(`✅ Connected to Redis at ${process.env.REDISHOST}`);
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
  });

} else {
  // Fallback to mock Redis for local development to prevent connection crashes and keep app running
  console.warn('⚠️ Local Redis not detected. Initializing mock In-Memory Redis Cache.');
  const EventEmitter = require('events');
  class MockRedis extends EventEmitter {
    constructor() {
      super();
      this.status = 'ready'; // set to ready to show as healthy and active
      this.store = new Map();
      process.nextTick(() => {
        this.emit('connect');
      });
    }
    call() { return Promise.resolve(0); }
    get(key) { 
      const entry = this.store.get(key);
      if (!entry) return Promise.resolve(null);
      if (entry.expires && Date.now() > entry.expires) {
        this.store.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value);
    }
    set(key, value) { 
      this.store.set(key, { value, expires: null });
      return Promise.resolve('OK'); 
    }
    setex(key, seconds, value) { 
      const expires = Date.now() + (seconds * 1000);
      this.store.set(key, { value, expires });
      return Promise.resolve('OK'); 
    }
    del(key) { 
      const deleted = this.store.delete(key);
      return Promise.resolve(deleted ? 1 : 0); 
    }
    scan(cursor, ...args) { 
      const keys = Array.from(this.store.keys());
      return Promise.resolve(['0', keys]); 
    }
    quit() { return Promise.resolve('OK'); }
    disconnect() {}
  }
  redis = new MockRedis();
}

// Global caching helper
const getCache = async (key) => {
  try {
    if (!redis || redis.status !== 'ready') return null; // 🛡️ Fail-soft check
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Silently ignore Redis errors to prevent console spam & latency
    return null;
  }
};

const setCache = async (key, value, expiresInSec = 3600) => {
  try {
    if (!redis || redis.status !== 'ready') return;
    await redis.setex(key, expiresInSec, JSON.stringify(value));
  } catch (error) {
    // Silently ignore
  }
};

/**
 * M-3 FIX: Use SCAN instead of KEYS for non-blocking cache invalidation.
 * KEYS is O(N) and blocks Redis during iteration — SCAN is incremental and safe in production.
 */
const clearCache = async (pattern) => {
  try {
    if (!redis || redis.status !== 'ready') return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (error) {
    // Silently ignore — cache miss is always safe
  }
};


module.exports = {
  redis,
  getCache,
  setCache,
  clearCache,
  isConnected: () => redis && redis.status === 'ready'
};
