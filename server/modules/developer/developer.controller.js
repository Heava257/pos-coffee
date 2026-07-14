const { db, logError } = require("../../src/util/helper");
const crypto = require("crypto");

// 1. Get all Developer API Keys
exports.getKeys = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const [keys] = await db.query("SELECT id, name, client_id, scopes, status, created_at FROM developer_keys ORDER BY id DESC");
    
    // Parse scopes back to arrays
    const formatted = keys.map(k => ({
      key: k.id.toString(),
      name: k.name,
      client_id: k.client_id,
      scopes: k.scopes ? JSON.parse(k.scopes) : [],
      created: k.created_at.toISOString().split("T")[0],
      status: k.status
    }));

    res.json({ list: formatted, success: true });
  } catch (error) {
    logError("developer.getKeys", error, res);
  }
};

// 2. Generate new API Key
exports.createKey = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { name, scopes } = req.body;
    if (!name) return res.status(400).json({ message: "Key name is required." });

    const client_id = "pk_live_" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const client_secret = "sk_live_" + crypto.randomBytes(24).toString("hex");
    const scopeStr = JSON.stringify(scopes || []);

    const [result] = await db.query(
      "INSERT INTO developer_keys (name, client_id, client_secret, scopes, status) VALUES (?, ?, ?, ?, 'active')",
      [name, client_id, client_secret, scopeStr]
    );

    res.json({
      success: true,
      message: "API key generated successfully.",
      key: {
        key: result.insertId.toString(),
        name,
        client_id,
        scopes: scopes || [],
        created: new Date().toISOString().split("T")[0],
        status: "active"
      }
    });
  } catch (error) {
    logError("developer.createKey", error, res);
  }
};

// 3. Revoke/Delete API Key
exports.deleteKey = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { id } = req.params;
    await db.query("DELETE FROM developer_keys WHERE id = ?", [id]);

    res.json({ success: true, message: "API key revoked successfully." });
  } catch (error) {
    logError("developer.deleteKey", error, res);
  }
};

// 4. Get Webhook Endpoints
exports.getWebhooks = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const [hooks] = await db.query("SELECT id, url, events, status, created_at FROM webhook_endpoints ORDER BY id DESC");
    
    const formatted = hooks.map(h => ({
      id: h.id.toString(),
      url: h.url,
      events: h.events ? JSON.parse(h.events) : [],
      status: h.status,
      created: h.created_at.toISOString().split("T")[0]
    }));

    res.json({ list: formatted, success: true });
  } catch (error) {
    logError("developer.getWebhooks", error, res);
  }
};

// 5. Add Webhook Endpoint
exports.createWebhook = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { url, events } = req.body;
    if (!url) return res.status(400).json({ message: "Webhook URL is required." });

    const eventStr = JSON.stringify(events || []);

    const [result] = await db.query(
      "INSERT INTO webhook_endpoints (url, events, status) VALUES (?, ?, 'active')",
      [url, eventStr]
    );

    res.json({
      success: true,
      message: "Webhook endpoint registered successfully.",
      webhook: {
        id: result.insertId.toString(),
        url,
        events: events || [],
        status: "active",
        created: new Date().toISOString().split("T")[0]
      }
    });
  } catch (error) {
    logError("developer.createWebhook", error, res);
  }
};

// 6. Delete Webhook Endpoint
exports.deleteWebhook = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { id } = req.params;
    await db.query("DELETE FROM webhook_endpoints WHERE id = ?", [id]);

    res.json({ success: true, message: "Webhook endpoint deleted successfully." });
  } catch (error) {
    logError("developer.deleteWebhook", error, res);
  }
};
