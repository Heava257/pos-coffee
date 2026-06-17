const express = require("express");
const router = express.Router();
const c = require("./payment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Relative to /api/v1/payments
router.post("/create", authMiddleware(), c.createPayment);
router.post("/callback", c.paymentCallback);
router.get("/status/:tran_id", authMiddleware(), c.checkPaymentStatus);
router.post("/simulate-success", authMiddleware(), c.simulateSuccess);

module.exports = router;