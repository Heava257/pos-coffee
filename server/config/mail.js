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
  platformSenderEmail: requireEnv('SENDER_EMAIL', 'info@growme.com'),
  brevoApiKey:         requireEnv('BREVO_API_KEY', process.env.SMTP_PASS || 'mock_api_key'),
  clientUrl:           process.env.CLIENT_URL || "http://localhost:5173",
};

