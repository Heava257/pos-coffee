const axios = require("axios");
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
      "SELECT id, url, events FROM webhook_endpoints WHERE status = 'active'"
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
        
        // Trigger the HTTP POST call in the background
        axios.post(hook.url, {
          id: `wh_${Math.random().toString(36).substr(2, 9)}`,
          event: event,
          created_at: new Date().toISOString(),
          data: payload
        }, {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "PlatformOS-Webhook-Dispatcher/2.0"
          },
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
