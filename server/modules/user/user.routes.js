const express = require("express");
const router = express.Router();
const c = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");
const { registerRules } = require("./user.validation");

router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware(), uploadMiddleware.single("upload_image"), registerRules, c.register);
router.put("/", authMiddleware(), uploadMiddleware.single("upload_image"), registerRules, c.register);
router.delete("/", authMiddleware(), c.remove);
router.get("/get-user-list", authMiddleware(), c.getList);
router.get("/switch-list", authMiddleware(), c.getStaffSwitchList);

module.exports = router;