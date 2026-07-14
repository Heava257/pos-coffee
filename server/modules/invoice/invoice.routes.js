const express = require("express");
const router = express.Router();
const c = require("./invoice.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/invoices
router.get("/:tran_id", authMiddleware("invoices"), c.generateInvoice);

module.exports = router;