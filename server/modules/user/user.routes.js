const express = require("express");
const router = express.Router();
const c = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");
const { registerRules } = require("./user.validation");

router.get("/", authMiddleware("user"), c.getList);
router.post("/", authMiddleware("user"), uploadMiddleware.single("upload_image"), registerRules, c.register);
router.put("/", authMiddleware("user"), uploadMiddleware.single("upload_image"), registerRules, c.register);
router.delete("/", authMiddleware("user"), c.remove);
router.get("/get-user-list", authMiddleware("user"), c.getList);
router.get("/switch-list", authMiddleware("user"), c.getStaffSwitchList);

module.exports = router;