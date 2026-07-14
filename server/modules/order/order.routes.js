const express = require("express");
const router = express.Router();
const c = require("./order.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/orders
router.get("/", authMiddleware("order"), c.getList);
router.get("/kds", authMiddleware("kds"), c.getKDSOrders);
router.get("/pending", authMiddleware("order"), c.getPendingOrders);
router.get("/:order_id", authMiddleware("order"), c.getOrderDetail);
router.post("/", authMiddleware("order"), c.create);
router.put("/status", authMiddleware("order"), c.updateStatus);
router.put("/kitchen-status", authMiddleware("kds"), c.updateKitchenStatus);
router.put("/send-to-kitchen", authMiddleware("order"), c.sendOrderToKitchen);
router.put("/", authMiddleware("order"), c.update);

// Guest/Web Ordering Routes
router.post("/web", c.createWebOrder);
router.get("/web/active", c.getActiveOrderByTable);
router.get("/web/:order_id", c.getOrderDetail);
router.get("/web/customer/:customer_id", c.getList);

module.exports = router;