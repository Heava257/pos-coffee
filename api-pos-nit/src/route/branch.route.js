const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    update,
    remove
} = require("../controller/branch.controller");

module.exports = (app) => {
    app.get("/api/branch", authMiddleware(), getList);
    app.post("/api/branch", authMiddleware(), create);
    app.put("/api/branch", authMiddleware(), update);
    app.delete("/api/branch", authMiddleware(), remove);
};
