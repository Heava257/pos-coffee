module.exports = {
  db: {
    HOST: process.env.DB_HOST || "localhost",
    USER: process.env.DB_USER || "root",
    PASSWORD: process.env.DB_PASSWORD || "",
    DATABASE: process.env.DB_DATABASE || "pos-coffee",
    PORT: process.env.DB_PORT || 3306,
  },
  platform_api_url: process.env.VITE_PLATFORM_API_URL || "https://platformsapi-production.up.railway.app/api",
  platform_hub_url: process.env.VITE_PLATFORM_HUB_URL || "https://platformhub-production.up.railway.app",
  token: {
    access_token_key: process.env.ACCESS_TOKEN_KEY || "your_secret_key",
    refresh_token_key: process.env.REFRESH_TOKEN_KEY || "your_refresh_secret_key",
  },
  image_path: process.env.IMAGE_PATH || "public/images/",
  flutter_secret_key: process.env.FLUTTER_SECRET_KEY || "FLWSECK_TEST-51f96fcfc9d06ac2d35ed8a01a523fae-X",
};
