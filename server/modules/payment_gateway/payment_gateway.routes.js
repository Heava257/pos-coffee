const express = require("express");
const router = express.Router();
const c = require("./payment_gateway.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Platform Owner Payment Gateways APIs
router.get("/", authMiddleware("settings"), c.getGateways);
router.put("/configure", authMiddleware("settings"), c.updateGateway);
router.put("/toggle", authMiddleware("settings"), c.toggleGatewayStatus);
router.get("/transactions", authMiddleware("settings"), c.getTransactionLogs);

module.exports = router;
