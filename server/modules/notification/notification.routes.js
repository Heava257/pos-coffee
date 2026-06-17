const express = require("express");
const router = express.Router();
const c = require("./notification.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getList);
router.post("/read-all", authMiddleware(), c.readAll);
router.get("/telegram", authMiddleware(), c.getTelegramConfig || ((req, res) => res.json({})));
router.post("/telegram/test", authMiddleware(), c.testTelegramConnection || ((req, res) => res.json({ success: true })));

module.exports = router;