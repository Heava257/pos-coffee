const express = require("express");
const router = express.Router();
const c = require("./role.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("role"), c.create);
router.put("/", authMiddleware("role"), c.update);
router.delete("/", authMiddleware("role"), c.remove);

module.exports = router;