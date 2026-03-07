const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    getOrderDetail,
    getPendingOrders,
    updateStatus
} = require("../controller/order.controller");

module.exports = (app) => {
    app.get("/api/order", authMiddleware(), getList);
    app.get("/api/order-pending", authMiddleware(), getPendingOrders);
    app.get("/api/order/:order_id", authMiddleware(), getOrderDetail);
    app.post("/api/order", authMiddleware(), create);
    app.post("/api/order/create", authMiddleware(), create); // Alias for convenience
    app.put("/api/order-status", authMiddleware(), updateStatus);
};
