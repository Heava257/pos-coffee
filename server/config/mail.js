module.exports = {
  platformSenderEmail: process.env.SENDER_EMAIL || "pongchiva257@gmail.com",
  brevoApiKey: process.env.BREVO_API_KEY || process.env.SMTP_PASS,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
