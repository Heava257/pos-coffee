const { db } = require("../src/util/helper");

async function run() {
    try {
        const [res] = await db.query("DESC order_details;");
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        process.exit();
    }
}

run();
