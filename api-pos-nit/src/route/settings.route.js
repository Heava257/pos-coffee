const authMiddleware = require("../middleware/auth.middleware");
const { getSettings, updateSettings } = require("../controller/settings.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/settings", authMiddleware(), getSettings);
    app.put("/api/settings", authMiddleware(), uploadFile.single("upload_logo"), updateSettings);
};
