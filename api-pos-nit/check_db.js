const connection = require("./src/util/connection");

async function checkProduct() {
    try {
        const [rows] = await connection.query("SELECT * FROM products WHERE barcode = '33681644'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProduct();
