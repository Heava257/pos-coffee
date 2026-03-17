const controller = require("../controller/shift.controller");
const authMiddleware = require("../middleware/auth.middleware");


module.exports = (app) => {
    app.post("/api/shift", authMiddleware(), controller.create);
    app.get("/api/shift", authMiddleware(), controller.getList);
};
