const { db } = require('./src/util/helper');
const dayjs = require('dayjs');

async function run() {
    console.log("🚀 Inserting sample wastage data for Business ID 3...");
    
    const products = [
        { id: 166, name: "Americano", price: 2.5, cost: 1.0 },
        { id: 167, name: "ទឹកសុទ្ធ Vital", price: 0.75, cost: 0.35 },
        { id: 170, name: "Desserts Cooking", price: 2, cost: 0.8 },
        { id: 171, name: "Iced Americano", price: 2.5, cost: 1.1 }
    ];

    const reasons = [
        "Barista Error (Wrong Make/Taste)",
        "Spillage / Dropped",
        "Product Expired",
        "Internal Store Use"
    ];

    const branch_id = 16;
    const business_id = 3;
    const today = dayjs().format("YYYY-MM-DD");

    let totalInserted = 0;
    for (let i = 0; i < 8; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const minuteStr = Math.floor(Math.random() * 59).toString().padStart(2, '0');
        const createdAt = `${today} 13:${minuteStr}:00`;

        const sql = `
            INSERT INTO stock_logs 
            (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, unit_cost, created_at)
            VALUES (?, ?, 'product', ?, 100, 97, ?, 'waste', ?, ?, ?, ?)
        `;
        
        const params = [
            business_id,
            branch_id,
            product.id,
            -qty,
            `WASTE-${i + 1}`,
            reason,
            product.cost,
            createdAt
        ];

        await db.query(sql, params);
        totalInserted++;
    }

    console.log(`✅ Successfully inserted ${totalInserted} wastage records!`);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Error inserting wastage data:", err);
    process.exit(1);
});
