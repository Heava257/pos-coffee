const { db } = require("./src/util/helper");
async function check() {
    const [cols] = await db.query("SHOW COLUMNS FROM orders");
    console.log(cols);
    process.exit(0);
}
check();
