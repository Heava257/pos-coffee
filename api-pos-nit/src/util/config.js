module.exports = {
  config: {
    db: {
      HOST: process.env.DB_HOST || "localhost",
      USER: process.env.DB_USER || "root",
      PASSWORD: process.env.DB_PASSWORD || "",
      DATABASE: process.env.DB_DATABASE || "pos_coffee",
      PORT: process.env.DB_PORT || 3306,
    },
    platform_api_url: process.env.VITE_PLATFORM_API_URL || "https://platformsapi-production.up.railway.app/api",
    platform_hub_url: process.env.VITE_PLATFORM_HUB_URL || "https://platformhub-production.up.railway.app",
    token: {
      access_token_key: process.env.ACCESS_TOKEN_KEY || "your_secret_key",
      refresh_token_key: process.env.REFRESH_TOKEN_KEY || "your_refresh_secret_key",
    },
  }
};
