const express = require("express");
const router = express.Router();
const c = require("./support.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Tickets
router.get("/tickets", authMiddleware("support-tickets"), c.getTickets);
router.post("/tickets", authMiddleware("support-tickets"), c.createTicket);

// Feedback
router.post("/feedback", authMiddleware("feedback"), c.createFeedback);

// Bugs
router.post("/bugs", authMiddleware("bug-reports"), c.createBug);

// Masquerade (Platform Admin only)
router.get("/tenants", authMiddleware("login-as-tenant"), c.getTenants);
router.post("/masquerade", authMiddleware("login-as-tenant"), c.masquerade);

module.exports = router;
