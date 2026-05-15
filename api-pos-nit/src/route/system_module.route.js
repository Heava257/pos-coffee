const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controller/system_module.controller");

module.exports = (app) => {
    app.get("/api/system_module", authMiddleware(), controller.getList);
    app.post("/api/system_module", authMiddleware(), controller.create);
    app.put("/api/system_module", authMiddleware(), controller.update);
    app.delete("/api/system_module", authMiddleware(), controller.remove);

    app.get("/api/system_module/:id/permissions", authMiddleware(), controller.getPermissions);
    app.post("/api/system_module/:id/permissions", authMiddleware(), controller.savePermissions);

    app.get("/api/permission_matrix", authMiddleware(), controller.getMatrix);
    app.post("/api/permission_matrix", authMiddleware(), controller.saveMatrix);
};
