const express = require("express");
const router = express.Router();
const c = require("./developer.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Platform Owner Developer APIs
router.get("/keys", authMiddleware("settings"), c.getKeys);
router.post("/keys", authMiddleware("settings"), c.createKey);
router.delete("/keys/:id", authMiddleware("settings"), c.deleteKey);

router.get("/webhooks", authMiddleware("settings"), c.getWebhooks);
router.post("/webhooks", authMiddleware("settings"), c.createWebhook);
router.delete("/webhooks/:id", authMiddleware("settings"), c.deleteWebhook);

module.exports = router;
