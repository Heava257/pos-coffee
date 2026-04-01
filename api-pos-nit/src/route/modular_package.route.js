const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controller/modular_package.controller");

module.exports = (app) => {
    app.get("/api/modular_package", authMiddleware(), controller.getList);
    app.post("/api/modular_package", authMiddleware(), controller.create);
    app.put("/api/modular_package", authMiddleware(), controller.update);
    app.get("/api/modular_package/permissions", authMiddleware(), controller.getPermissions);
};
