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

module.exports = {
  db: {
    HOST:     isProd ? requireEnv('DB_PROD_HOST')     : (process.env.DB_HOST     || "localhost"),
    USER:     isProd ? requireEnv('DB_PROD_USER')     : (process.env.DB_USER     || "root"),
    PASSWORD: isProd ? requireEnv('DB_PROD_PASSWORD') : requireEnv('DB_PASSWORD'),
    DATABASE: isProd ? requireEnv('DB_PROD_DATABASE') : (process.env.DB_DATABASE || "coffee_saas"),
    PORT:     isProd ? (process.env.DB_PROD_PORT || 3306) : (Number(process.env.DB_PORT) || 3306),
  },
  platform_api_url: process.env.VITE_PLATFORM_API_URL || "http://localhost:3000/api",
  platform_hub_url: process.env.VITE_PLATFORM_HUB_URL || "http://localhost:3000",
  token: {
    access_token_key:  requireEnv('ACCESS_TOKEN_KEY'),
    refresh_token_key: requireEnv('REFRESH_TOKEN_KEY'),
  },
  image_path: process.env.IMAGE_PATH || "public/images/",
  flutter_secret_key: requireEnv('FLUTTER_SECRET_KEY', 'local_dev_flutter_secret_key'),

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  payway: {
    merchant_id:  process.env.PAYWAY_MERCHANT_ID  || "demo_merchant",
    api_key:      process.env.PAYWAY_API_KEY      || "demo_api_key",
    base_url:     process.env.PAYWAY_BASE_URL     || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments",
    callback_url: process.env.PAYWAY_CALLBACK_URL || "http://localhost:8080/api/payment/callback",
    return_url:   process.env.PAYWAY_RETURN_URL   || "http://localhost:3000/payment/result",
  },

  app_url: process.env.APP_URL || "http://localhost:3000",
};

