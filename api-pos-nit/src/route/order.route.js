const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    getOrderDetail,
    getPendingOrders,
    updateStatus,
    getKDSOrders,
    updateKitchenStatus,
    createWebOrder
} = require("../controller/order.controller");

module.exports = (app) => {
    app.post("/api/order-web", createWebOrder); // Public route for QR ordering
    app.get("/api/order-web/:order_id", getOrderDetail); // Status tracking for guests
    app.get("/api/order", authMiddleware("order"), getList);
    app.get("/api/order-kds", authMiddleware("order"), getKDSOrders);
    app.get("/api/order-pending", authMiddleware("order"), getPendingOrders);
    app.get("/api/order/:order_id", authMiddleware("order"), getOrderDetail);
    app.post("/api/order", authMiddleware("order"), create);
    app.post("/api/order/create", authMiddleware("order"), create); // Alias for convenience
    app.put("/api/order-status", authMiddleware("order"), updateStatus);
    app.put("/api/order-kitchen-status", authMiddleware("order"), updateKitchenStatus);
    app.put("/api/order", authMiddleware("order"), require("../controller/order.controller").update);
};
