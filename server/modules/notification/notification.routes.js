const express = require("express");
const router = express.Router();
const c = require("./notification.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("notifications"), c.getList);
router.post("/", authMiddleware("notifications"), c.create);
router.post("/read-all", authMiddleware("notifications"), c.readAll);
router.delete("/:id", authMiddleware("notifications"), c.remove);
router.get("/telegram", authMiddleware("notifications"), c.getTelegramConfig || ((req, res) => res.json({})));
router.post("/telegram/test", authMiddleware("notifications"), c.testTelegramConnection || ((req, res) => res.json({ success: true })));

module.exports = router;