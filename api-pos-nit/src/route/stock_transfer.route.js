const controller = require("../controller/stock_transfer.controller");
const authMiddleware = require("../middleware/auth.middleware");

module.exports = (app) => {
    app.get("/api/stock-transfer", authMiddleware("stock-transfer"), controller.getList);
    app.get("/api/stock-transfer/:id", authMiddleware("stock-transfer"), controller.getDetails);
    app.post("/api/stock-transfer", authMiddleware("stock-transfer"), controller.create);
    app.post("/api/stock-transfer/receive", authMiddleware("stock-transfer"), controller.receive);
    app.post("/api/stock-transfer/cancel", authMiddleware("stock-transfer"), controller.cancel);
};
