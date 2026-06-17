const cron = require("node-cron");
const db = require("../config/database");

const start = () => {
    cron.schedule("55 23 * * *", async () => {
        console.log("[JOB] Aggregating daily sales summary...");
        try {
            // Aggregate sales transactions into a daily report
        } catch (error) {
            console.error("[JOB ERROR] Sales summary task failed:", error.message);
        }
    });
};

module.exports = { start };
