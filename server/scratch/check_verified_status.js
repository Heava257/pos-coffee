require('dotenv').config();
const { db } = require("../src/util/helper");

async function check() {
    try {
        const [users] = await db.query(
            "SELECT id, business_id, name, email, is_verified, is_super_admin, verify_token FROM users WHERE id IN (41, 50)"
        );
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
