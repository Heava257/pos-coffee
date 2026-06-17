const cron = require("node-cron");
const db = require("../config/database");

const start = () => {
    cron.schedule("0 1 * * *", async () => {
        console.log("[JOB] Running stock forecasting...");
        try {
            // Predict replenishment dates based on average daily usage logs
        } catch (error) {
            console.error("[JOB ERROR] Stock forecasting check failed:", error.message);
        }
    });
};

module.exports = { start };
