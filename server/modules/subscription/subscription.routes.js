const express = require("express");
const router = express.Router();
const c = require("./subscription.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/subscriptions
router.get("/packages/public", c.getListPackagesPublic);
router.get("/packages", authMiddleware("subscription"), c.getListPackages);
router.post("/packages", authMiddleware("subscription"), c.createPackage);
router.put("/packages", authMiddleware("subscription"), c.updatePackage);
router.get("/packages/permissions", authMiddleware("subscription"), c.getPackagePermissions);

router.get("/modules", authMiddleware("subscription"), c.getListModules);
router.post("/modules", authMiddleware("subscription"), c.createModule);
router.put("/modules", authMiddleware("subscription"), c.updateModule);
router.delete("/modules", authMiddleware("subscription"), c.deleteModule);
router.get("/modules/:id/permissions", authMiddleware("subscription"), c.getModulePermissions);
router.post("/modules/:id/permissions", authMiddleware("subscription"), c.saveModulePermissions);

router.get("/matrix", authMiddleware("subscription"), c.getMatrix);
router.post("/matrix", authMiddleware("subscription"), c.saveMatrix);

module.exports = router;