const { redis } = require("../src/util/redisClient");

async function flushRedis() {
  try {
    console.log("Connecting to Redis...");
    // Wait for redis to be ready if needed
    if (redis.status !== 'ready') {
        console.log("Waiting for redis connection...");
        await new Promise(resolve => redis.once('ready', resolve));
    }
    await redis.flushall();
    console.log("✅ Redis Cache Flushed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error flushing Redis:", error);
    process.exit(1);
  }
}

flushRedis();
