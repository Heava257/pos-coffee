const { db } = require('./src/util/helper');
const dayjs = require('dayjs');

async function run() {
    console.log("🚀 Spreading sample sales across the whole day for Business ID 3...");
    
    const products = [
        { id: 166, name: "Americano", price: 2.5, category: "Hot Coffee" },
        { id: 167, name: "ទឹកសុទ្ធ Vital", price: 0.75, category: "Drink" },
        { id: 170, name: "Desserts Cooking", price: 2, category: "Cakes & Desserts" },
        { id: 171, name: "Iced Americano", price: 2.5, category: "Iced Coffee" }
    ];

    const branch_id = 16;
    const business_id = 3;
    const today = dayjs().format("YYYY-MM-DD");

    // Hours to distribute sales (Morning, Lunch, Afternoon, Evening)
    const hours = [7, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 21];
    
    let totalInserted = 0;
    for (const h of hours) {
        // Each hour has 1-4 sales
        const salesInHour = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < salesInHour; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            const hourStr = h.toString().padStart(2, '0');
            const minuteStr = Math.floor(Math.random() * 59).toString().padStart(2, '0');
            const createdAt = `${today} ${hourStr}:${minuteStr}:00`;

            const sql = `
                INSERT INTO stock_logs 
                (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_at)
                VALUES (?, ?, 'product', ?, 100, 99, ?, 'sale', ?, ?, ?)
            `;
            
            const params = [
                business_id,
                branch_id,
                product.id,
                -qty,
                `B3-SPREAD-${h}-${i + 1}`,
                `Spread Sale: ${product.name}`,
                createdAt
            ];

            await db.query(sql, params);
            totalInserted++;
        }
    }

    console.log(`✅ Successfully distributed ${totalInserted} sales across the day!`);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Error distributing sample data:", err);
    process.exit(1);
});
