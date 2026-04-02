const { db } = require("./src/util/helper");
async function check() {
    try {
        const [rows] = await db.query("DESCRIBE businesses");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
