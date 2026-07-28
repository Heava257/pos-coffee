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

module.exports = {
  flutter_secret_key: requireEnv('FLUTTER_SECRET_KEY', 'local_dev_flutter_secret_key'),
  payway: {
    merchant_id:  process.env.PAYWAY_MERCHANT_ID  || "demo_merchant",
    api_key:      process.env.PAYWAY_API_KEY      || "demo_api_key",
    base_url:     process.env.PAYWAY_BASE_URL     || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments",
    callback_url: process.env.PAYWAY_CALLBACK_URL || "http://localhost:8080/api/payment/callback",
    return_url:   process.env.PAYWAY_RETURN_URL   || "http://localhost:3000/payment/result",
  }
};

