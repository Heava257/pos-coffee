const express = require("express");
const router = express.Router();
const c = require("./permission.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("permission"), c.getAllPermissions);
router.get("/:role_id", authMiddleware("permission"), c.getRolePermissions);
router.post("/assign", authMiddleware("permission"), c.updateRolePermissions);

module.exports = router;