const express = require("express");
const router = express.Router();
const c = require("./employee.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/employees
router.get("/", authMiddleware("employee"), c.getList);
router.get("/performance", authMiddleware("employee"), c.getPerformance);
router.post("/", authMiddleware("employee"), c.create);
router.put("/", authMiddleware("employee"), c.update);
router.delete("/", authMiddleware("employee"), c.remove);

module.exports = router;
