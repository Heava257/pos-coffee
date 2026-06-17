const express = require("express");
const router = express.Router();
const c = require("./order.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/orders
router.get("/", authMiddleware(), c.getList);
router.get("/kds", authMiddleware(), c.getKDSOrders);
router.get("/pending", authMiddleware(), c.getPendingOrders);
router.get("/:order_id", authMiddleware(), c.getOrderDetail);
router.post("/", authMiddleware(), c.create);
router.put("/status", authMiddleware(), c.updateStatus);
router.put("/kitchen-status", authMiddleware(), c.updateKitchenStatus);
router.put("/send-to-kitchen", authMiddleware(), c.sendOrderToKitchen);
router.put("/", authMiddleware(), c.update);

// Guest/Web Ordering Routes
router.post("/web", c.createWebOrder);
router.get("/web/active", c.getActiveOrderByTable);
router.get("/web/:order_id", c.getOrderDetail);
router.get("/web/customer/:customer_id", c.getList);

module.exports = router;