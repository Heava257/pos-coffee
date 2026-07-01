/**
 * Config — fail-fast on missing critical secrets (C-2 fix).
 * Non-secret defaults (URLs, optional features) are allowed.
 */
const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`[CONFIG] Missing required environment variable: ${key}. Set it in your .env file.`);
  }
  return val;
};

const isProd = process.env.APP_ENV === 'production';

module.exports = {
  db: {
    HOST:     isProd ? requireEnv('DB_PROD_HOST')     : (process.env.DB_HOST     || 'localhost'),
    USER:     isProd ? requireEnv('DB_PROD_USER')     : (process.env.DB_USER     || 'root'),
    PASSWORD: isProd ? requireEnv('DB_PROD_PASSWORD') : requireEnv('DB_PASSWORD'),
    DATABASE: isProd ? requireEnv('DB_PROD_DATABASE') : (process.env.DB_DATABASE || 'coffee_saas'),
    PORT:     isProd ? (process.env.DB_PROD_PORT || 3306) : (process.env.DB_PORT || 3306),
  },

  token: {
    // Must be set explicitly — no weak fallback ever
    access_token_key:  requireEnv('ACCESS_TOKEN_KEY'),
    refresh_token_key: requireEnv('REFRESH_TOKEN_KEY'),
  },

  // Optional integrations — safe to be absent in local dev
  flutter_secret_key: process.env.FLUTTER_SECRET_KEY || null,

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || null,
    api_key:    process.env.CLOUDINARY_API_KEY    || null,
    api_secret: process.env.CLOUDINARY_API_SECRET || null,
  },

  payway: {
    merchant_id:  process.env.PAYWAY_MERCHANT_ID  || 'demo_merchant',
    api_key:      process.env.PAYWAY_API_KEY      || 'demo_api_key',
    base_url:     process.env.PAYWAY_BASE_URL     || 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments',
    callback_url: process.env.PAYWAY_CALLBACK_URL || 'http://localhost:8080/api/payment/callback',
    return_url:   process.env.PAYWAY_RETURN_URL   || 'http://localhost:5173/payment/result',
  },

  platform_api_url: process.env.VITE_PLATFORM_API_URL || 'http://localhost:8080/api',
  platform_hub_url: process.env.VITE_PLATFORM_HUB_URL || 'http://localhost:5173',
  app_url:          process.env.APP_URL            || 'http://localhost:5173',
  image_path:       process.env.IMAGE_PATH         || 'public/images/',

  // Platform-level Telegram (C-1 fix — no token in code)
  platform_telegram: {
    token:   process.env.PLATFORM_TELEGRAM_TOKEN   || null,
    chat_id: process.env.PLATFORM_TELEGRAM_CHAT_ID || null,
  },
};
