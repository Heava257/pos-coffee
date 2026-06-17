const express = require("express");
const router = express.Router();
const c = require("./branch.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("branch"), c.create);
router.put("/", authMiddleware("branch"), c.update);
router.delete("/", authMiddleware("branch"), c.remove);

module.exports = router;