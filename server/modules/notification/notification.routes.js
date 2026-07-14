const express = require("express");
const router = express.Router();
const c = require("./notification.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("notifications"), c.getList);
router.post("/read-all", authMiddleware("notifications"), c.readAll);
router.get("/telegram", authMiddleware("notifications"), c.getTelegramConfig || ((req, res) => res.json({})));
router.post("/telegram/test", authMiddleware("notifications"), c.testTelegramConnection || ((req, res) => res.json({ success: true })));

module.exports = router;