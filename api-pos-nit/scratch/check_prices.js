const { db } = require("../src/util/helper");

async function checkPrices() {
  try {
    const bizId = 3;
    const branchId = 16;
    
    console.log(`Checking prices for Business: ${bizId}, Branch: ${branchId}`);
    
    const [rows] = await db.query(`
      SELECT p.id, p.name, bp.price, p.sizes
      FROM products p
      LEFT JOIN branch_products bp ON p.id = bp.product_id AND bp.branch_id = ?
      WHERE p.business_id = ?
    `, [branchId, bizId]);
    
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkPrices();
