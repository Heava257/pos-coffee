const express = require("express");
const router = express.Router();
const c = require("./supplier.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("supplier"), c.create);
router.put("/", authMiddleware("supplier"), c.update);
router.delete("/", authMiddleware("supplier"), c.remove);

module.exports = router;