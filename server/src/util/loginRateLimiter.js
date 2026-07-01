const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default || require("rate-limit-redis");
const { redis } = require("./redisClient");

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per `windowMs`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args) => redis.call(...args),
  }),
  keyGenerator: (req) => req.ip,
  handler: (req, res, next, options) => {
    const retryAfter = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000) : 300;
    return res.status(options.statusCode).json({
       retryAfter: retryAfter,
       message: "គណនីរបស់អ្នកត្រូវបានផ្អាកជាបណ្ដោះអាសន្ន ដោយសារព្យាយាម Login ខុសច្រើនដង។ សូមរងចាំ ៥ នាទី!"
    });
  }
});

module.exports = loginRateLimiter;
