const express = require("express");
const router = express.Router();
const c = require("./payment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const invoiceController = require("../invoice/invoice.controller");

// Relative to /api/v1/payments
router.post("/create", authMiddleware(), c.createPayment);
router.post("/callback", c.paymentCallback);
router.get("/status/:tran_id", authMiddleware(), c.checkPaymentStatus);
router.post("/simulate-success", authMiddleware(), c.simulateSuccess);
router.get("/invoice/:tran_id", authMiddleware(), invoiceController.generateInvoice);

module.exports = router;