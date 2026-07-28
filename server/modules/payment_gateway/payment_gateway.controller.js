const { db, logError } = require("../../src/util/helper");

// 1. Get all Payment Gateways
exports.getGateways = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const [gateways] = await db.query("SELECT * FROM payment_gateways ORDER BY id ASC");
    res.json({ list: gateways, success: true });
  } catch (error) {
    logError("payment_gateway.getGateways", error, res);
  }
};

// 2. Update Payment Gateway credentials
exports.updateGateway = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { id, merchant_id, api_key, secure_hash } = req.body;
    if (!id) return res.status(400).json({ message: "Gateway ID is required." });

    await db.query(
      "UPDATE payment_gateways SET merchant_id = ?, api_key = ?, secure_hash = ? WHERE id = ?",
      [merchant_id, api_key, secure_hash, id]
    );

    // Sync to system_settings if ABA PayWay (ID 1)
    if (parseInt(id) === 1) {
      await db.query(
        "UPDATE system_settings SET sett_value = ? WHERE sett_key = 'payway_merchant_id'",
        [merchant_id]
      );
      await db.query(
        "UPDATE system_settings SET sett_value = ? WHERE sett_key = 'payway_api_key'",
        [api_key]
      );
    }

    res.json({ success: true, message: "Gateway credentials updated successfully." });
  } catch (error) {
    logError("payment_gateway.updateGateway", error, res);
  }
};

// 3. Toggle Payment Gateway Active status
exports.toggleGatewayStatus = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ message: "Gateway ID and status are required." });

    await db.query(
      "UPDATE payment_gateways SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ success: true, message: `Gateway status set to ${status}.` });
  } catch (error) {
    logError("payment_gateway.toggleGatewayStatus", error, res);
  }
};

// 4. Get Platformwide transaction logs
exports.getTransactionLogs = async (req, res) => {
  try {
    if (req.business_id !== 1) {
      return res.status(403).json({ error: "Forbidden", message: "Platform admin access only." });
    }

    const [logs] = await db.query(`
      SELECT 
        o.id AS \`key\`,
        o.created_at AS time,
        o.payment_method AS gateway,
        o.total_amount AS amount,
        b.name AS tenant,
        o.status
      FROM orders o
      INNER JOIN businesses b ON o.business_id = b.id
      ORDER BY o.id DESC
      LIMIT 10
    `);

    // Format fields (e.g. time, amount)
    const formatted = logs.map(l => ({
      key: l.key.toString(),
      time: l.time,
      gateway: l.gateway || "N/A",
      amount: `$${Number(l.amount || 0).toFixed(2)}`,
      tenant: l.tenant || "Unknown Shop",
      status: l.status === "completed" || l.status === "paid" || l.status === "success" ? "success" : "failed"
    }));

    res.json({ list: formatted, success: true });
  } catch (error) {
    logError("payment_gateway.getTransactionLogs", error, res);
  }
};
