// util/config.js

// config.js
module.exports = {
  config: {
    app_name: "POS-NIT",
    app_versoin: "1.0",

    image_path: "C:/xampp/htdocs/fullstack/",
    db: {
      HOST: process.env.DB_HOST || "localhost",
      USER: process.env.DB_USER || "root",
      PASSWORD: process.env.DB_PASSWORD || "",
      DATABASE: process.env.DB_DATABASE || "pos-coffee",
      PORT: process.env.DB_PORT || 3306,
    },
    flutter_secret_key: process.env.FLUTTER_SECRET_KEY || "FLWSECK_TEST-51f96fcfc9d06ac2d35ed8a01a523fae-X",
    platform_api_url: process.env.VITE_PLATFORM_API_URL || "http://localhost:5001/api",
    platform_hub_url: process.env.VITE_PLATFORM_URL || "http://localhost:3000",
    token: {
      access_token_key: process.env.ACCESS_TOKEN_KEY || "saas_hub_secret_key_2024",
      refresh_token_key: process.env.REFRESH_TOKEN_KEY || "REFRESH_saas_hub_secret_key_2024",
    },
  },
};
