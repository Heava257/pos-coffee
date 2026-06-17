const cron = require("node-cron");
const db = require("../config/database");

const start = () => {
    cron.schedule("* * * * *", async () => {
        try {
            // Process queue or handle telegram report alerts
        } catch (error) {
            console.error("[JOB ERROR] Telegram alerting failed:", error.message);
        }
    });
};

module.exports = { start };
