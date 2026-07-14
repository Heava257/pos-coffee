const express = require("express");
const router = express.Router();
const c = require("./business.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

router.get("/", authMiddleware("business"), c.getList);
router.post("/", authMiddleware("business"), uploadMiddleware.single("logo"), c.create);
router.put("/", authMiddleware("business"), uploadMiddleware.single("logo"), c.update);
router.delete("/", authMiddleware("business"), c.remove);

router.get("/config", authMiddleware("config"), c.getBusinessConfig);
router.get("/exchange", authMiddleware("exchange_rate"), c.getExchangeRate);
router.get("/settings", authMiddleware("settings"), c.getSettings);
router.put("/settings", authMiddleware("settings"), uploadMiddleware.fields([{ name: 'logo', maxCount: 1 }, { name: 'khqr_image', maxCount: 1 }]), c.updateSettings);
router.get("/insights", authMiddleware("business"), c.getInsights);
router.put("/plan", authMiddleware("business"), c.updatePlan);
router.put("/status", authMiddleware("business"), c.updateStatus);
router.get("/public-config", c.getPublicConfig);
router.get("/smtp-health", authMiddleware("business"), c.getSMTPHealth);

module.exports = router;