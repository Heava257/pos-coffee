const axios = require("axios");
const crypto = require("crypto");
const { db } = require("./helper");

/**
 * Dispatches a webhook event to all registered active webhook endpoints
 * that subscribed to the specific event.
 * Runs asynchronously in the background.
 *
 * @param {string} event - The event type (e.g. 'order.created')
 * @param {object} payload - The event payload data
 */
const dispatch = async (event, payload) => {
  try {
    // 1. Fetch active webhooks from database
    const [hooks] = await db.query(
      "SELECT id, url, secret, events FROM webhook_endpoints WHERE status = 'active'"
    );

    for (const hook of hooks) {
      let events = [];
      try {
        events = hook.events ? JSON.parse(hook.events) : [];
      } catch (e) {
        events = [];
      }

      // Check if this webhook is subscribed to the event
      if (events.includes(event)) {
        console.log(`[Webhook Dispatcher] Dispatching event '${event}' to ${hook.url}...`);
        
        const payloadData = {
          id: `wh_${crypto.randomBytes(8).toString("hex")}`,
          event: event,
          created_at: new Date().toISOString(),
          data: payload
        };
        const bodyString = JSON.stringify(payloadData);

        const headers = {
          "Content-Type": "application/json",
          "User-Agent": "PlatformOS-Webhook-Dispatcher/2.0"
        };

        // Compute HMAC-SHA256 signature if webhook secret is configured
        if (hook.secret) {
          const signature = crypto
            .createHmac("sha256", hook.secret)
            .update(bodyString)
            .digest("hex");
          headers["X-Platform-Signature"] = signature;
        }

        // Trigger the HTTP POST call in the background
        axios.post(hook.url, bodyString, {
          headers,
          timeout: 5000 // 5 seconds timeout
        }).then(response => {
          console.log(`[Webhook Dispatcher] Event '${event}' successfully delivered to ${hook.url} (Status: ${response.status})`);
        }).catch(err => {
          console.error(`[Webhook Dispatcher ERROR] Failed to deliver event '${event}' to ${hook.url}: ${err.message}`);
        });
      }
    }
  } catch (error) {
    console.error("[Webhook Dispatcher ERROR] Failed to fetch webhook endpoints:", error.message);
  }
};

module.exports = { dispatch };
