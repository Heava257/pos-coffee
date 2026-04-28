const authMiddleware = require("../middleware/auth.middleware");
const { getList, create } = require("../controller/waste.controller");

module.exports = (app) => {
    app.get("/api/waste", authMiddleware(), getList);
    app.post("/api/waste", authMiddleware(), create);
};
