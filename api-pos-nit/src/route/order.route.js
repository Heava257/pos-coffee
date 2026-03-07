const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    getOrderDetail
} = require("../controller/order.controller");

module.exports = (app) => {
    app.get("/api/order", authMiddleware(), getList);
    app.get("/api/order/:order_id", authMiddleware(), getOrderDetail);
    app.post("/api/order", authMiddleware(), create);
};
