require('dotenv').config();
const mysql = require("mysql2/promise");

async function checkUserDB() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'coffee_saas',
            port: process.env.DB_PORT || 3306
        });

        // 1. Get all users
        const [users] = await connection.execute("SELECT id, name, email, role_id, business_id FROM users");
        console.log("USERS IN DB:", users);

        // 2. Get roles
        const [roles] = await connection.execute("SELECT id, name, code, business_id FROM roles");
        console.log("ROLES IN DB:", roles);

        // 3. Get permissions
        const [perms] = await connection.execute("SELECT id, name, route_key FROM permissions WHERE route_key LIKE '%devops%'");
        console.log("DEVOPS PERMISSIONS IN DB:", perms);

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}
checkUserDB();
