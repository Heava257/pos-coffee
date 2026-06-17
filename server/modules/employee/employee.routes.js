const express = require("express");
const router = express.Router();
const c = require("./employee.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/employees
router.get("/", authMiddleware(), c.getList);
router.get("/performance", authMiddleware(), c.getPerformance);
router.post("/", authMiddleware(), c.create);
router.put("/", authMiddleware(), c.update);
router.delete("/", authMiddleware(), c.remove);

module.exports = router;
