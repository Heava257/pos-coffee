const { db } = require('./helper');
const axios = require('axios');
const config = require('./config');

/**
 * Log security events to the database and send Telegram alerts to Platform Owner.
 */
const logSecurityEvent = async (ip, eventType, endpoint = null, userAgent = null, details = null) => {
  const detailsStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;

  try {
    // 1. Insert into security_logs table
    await db.query(
      "INSERT INTO security_logs (ip, event_type, endpoint, user_agent, details) VALUES (?, ?, ?, ?, ?)",
      [ip, eventType, endpoint, userAgent, detailsStr]
    );
    console.log(`🛡️ Security Event Logged: [${eventType}] from IP: ${ip}`);

    // 2. Send Telegram Alert if configured
    const token = config.platform_telegram?.token;
    const chatId = config.platform_telegram?.chat_id;

    if (token && chatId) {
      const message = `🚨 <b>GrowMe Security Alert</b> 🚨\n\n` +
                      `<b>Event:</b> <code>${eventType}</code>\n` +
                      `<b>IP Address:</b> <code>${ip}</code>\n` +
                      `<b>Endpoint:</b> <code>${endpoint || 'N/A'}</code>\n` +
                      `<b>User Agent:</b> <i>${userAgent || 'N/A'}</i>\n` +
                      `<b>Details:</b> <code>${detailsStr || 'None'}</code>\n` +
                      `<b>Time:</b> <code>${new Date().toISOString()}</code>`;

      axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }).catch(err => {
        console.error('❌ Failed to send Telegram security alert:', err.message);
      });
    }
  } catch (err) {
    console.error('❌ Failed to log security event:', err.message);
  }
};

module.exports = { logSecurityEvent };
