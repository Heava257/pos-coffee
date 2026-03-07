const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    updateStatus,
    remove
} = require("../controller/table.controller");

module.exports = (app) => {
    app.get("/api/table", authMiddleware(), getList);
    app.post("/api/table", authMiddleware(), create);
    app.put("/api/table-status", authMiddleware(), updateStatus);
    app.delete("/api/table", authMiddleware(), remove);
};
