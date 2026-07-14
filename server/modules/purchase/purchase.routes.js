const express = require("express");
const router = express.Router();
const c = require("./purchase.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/purchases
router.get("/", authMiddleware("purchase"), c.getList);
router.get("/details", authMiddleware("purchase"), c.getDetails);
router.post("/", authMiddleware("purchase"), c.create);
router.post("/receive", authMiddleware("purchase"), c.receive);
router.post("/approve", authMiddleware("purchase"), c.approve);
router.delete("/", authMiddleware("purchase"), c.remove);

module.exports = router;