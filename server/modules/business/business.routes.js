const express = require("express");
const router = express.Router();
const c = require("./business.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware(), uploadMiddleware.single("logo"), c.create);
router.put("/", authMiddleware(), uploadMiddleware.single("logo"), c.update);
router.delete("/", authMiddleware(), c.remove);

router.get("/config", authMiddleware(), c.getBusinessConfig);
router.get("/exchange", authMiddleware(), c.getExchangeRate);
router.get("/settings", authMiddleware(), c.getSettings);
router.put("/settings", authMiddleware(), uploadMiddleware.fields([{ name: 'logo', maxCount: 1 }, { name: 'khqr_image', maxCount: 1 }]), c.updateSettings);
router.get("/insights", authMiddleware(), c.getInsights);
router.put("/plan", authMiddleware(), c.updatePlan);
router.put("/status", authMiddleware(), c.updateStatus);
router.get("/public-config", c.getPublicConfig);

module.exports = router;