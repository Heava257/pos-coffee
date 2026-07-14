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
