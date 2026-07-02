module.exports = {
  flutter_secret_key: process.env.FLUTTER_SECRET_KEY || "FLWSECK_TEST-51f96fcfc9d06ac2d35ed8a01a523fae-X",
  payway: {
    merchant_id: process.env.PAYWAY_MERCHANT_ID || "demo_merchant",
    api_key: process.env.PAYWAY_API_KEY || "demo_api_key",
    base_url: process.env.PAYWAY_BASE_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments",
    callback_url: process.env.PAYWAY_CALLBACK_URL || "http://localhost:8080/api/payment/callback",
    return_url: process.env.PAYWAY_RETURN_URL || "http://localhost:3000/payment/result",
  }
};
