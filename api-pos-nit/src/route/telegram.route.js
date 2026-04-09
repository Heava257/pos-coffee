const controller = require("../controller/telegram.controller");
const express = require("express");
const router = express.Router();

router.post("/webhook/:business_id", controller.handleWebhook);

module.exports = (app) => {
    app.use("/api/telegram", router);
};
