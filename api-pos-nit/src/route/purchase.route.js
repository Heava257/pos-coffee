const authMiddleware = require("../middleware/auth.middleware");
const {
    create,
    getList,
    getDetails,
    receive,
    remove,
    approve
} = require("../controller/purchase.controller");

module.exports = (app) => {
    app.get("/api/purchase", authMiddleware(), getList);
    app.get("/api/purchase-details", authMiddleware(), getDetails);
    app.post("/api/purchase", authMiddleware(), create);
    app.post("/api/purchase-receive", authMiddleware(), receive);
    app.post("/api/purchase-approve", authMiddleware(), approve);
    app.delete("/api/purchase", authMiddleware(), remove);
};
