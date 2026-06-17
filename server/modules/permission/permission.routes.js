const express = require("express");
const router = express.Router();
const c = require("./permission.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getAllPermissions);
router.get("/:role_id", authMiddleware(), c.getRolePermissions);
router.post("/assign", authMiddleware(), c.updateRolePermissions);

module.exports = router;