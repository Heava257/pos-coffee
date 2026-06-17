const express = require("express");
const router = express.Router();
const c = require("./report.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/reports
router.get("/sale-summary", authMiddleware(), c.report_Sale_Summary);
router.get("/expense-summary", authMiddleware(), c.report_Expense_Summary);
router.get("/customer", authMiddleware(), c.report_Customer);
router.get("/purchase-summary", authMiddleware(), c.report_Purchase_Summary);
router.get("/top-sales", authMiddleware(), c.top_sale);

module.exports = router;