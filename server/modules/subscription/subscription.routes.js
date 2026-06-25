const express = require("express");
const router = express.Router();
const c = require("./subscription.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/subscriptions
router.get("/packages/public", c.getListPackagesPublic);
router.get("/packages", authMiddleware(), c.getListPackages);
router.post("/packages", authMiddleware(), c.createPackage);
router.put("/packages", authMiddleware(), c.updatePackage);
router.get("/packages/permissions", authMiddleware(), c.getPackagePermissions);

router.get("/modules", authMiddleware(), c.getListModules);
router.post("/modules", authMiddleware(), c.createModule);
router.put("/modules", authMiddleware(), c.updateModule);
router.delete("/modules", authMiddleware(), c.deleteModule);
router.get("/modules/:id/permissions", authMiddleware(), c.getModulePermissions);
router.post("/modules/:id/permissions", authMiddleware(), c.saveModulePermissions);

router.get("/matrix", authMiddleware(), c.getMatrix);
router.post("/matrix", authMiddleware(), c.saveMatrix);

module.exports = router;