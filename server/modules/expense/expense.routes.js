const express = require("express");
const router = express.Router();
const c = require("./expense.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/expenses
router.get("/type", authMiddleware(), c.getExpenseTypes);
router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("expense"), c.create);
router.put("/", authMiddleware("expense"), c.update);
router.delete("/", authMiddleware("expense"), c.remove);

module.exports = router;