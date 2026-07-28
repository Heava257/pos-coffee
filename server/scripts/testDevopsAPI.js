require('dotenv').config();
const { getMetrics } = require("../modules/devops/devops.controller");

async function testAPI() {
    const req = {
        business_id: 1
    };
    const res = {
        status: function(code) {
            console.log("Response status code:", code);
            return this;
        },
        json: function(data) {
            console.log("API Response Data:", JSON.stringify(data, null, 2));
        }
    };
    try {
        await getMetrics(req, res);
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        process.exit(0);
    }
}
testAPI();
