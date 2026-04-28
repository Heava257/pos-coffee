const { db } = require('./src/util/helper');
const dayjs = require('dayjs');

async function run() {
    console.log("🚀 Inserting sample expense data for Business ID 3...");
    
    const expenses = [
        { name: "Electricity Bill (Today Portion)", amount: 5.5, type: "Utility" },
        { name: "Staff Daily Lunch", amount: 12.0, type: "Salary/Benefits" },
        { name: "Shop Daily Rental", amount: 15.0, type: "Rental" },
        { name: "Packaging/Napkins", amount: 3.5, type: "Other" }
    ];

    const branch_id = 16;
    const business_id = 3;
    const today = dayjs().format("YYYY-MM-DD");

    let totalInserted = 0;
    for (const exp of expenses) {
        const sql = `
            INSERT INTO expense 
            (business_id, branch_id, expense_type_id, amount, expense_date, description, payment_method, created_at)
            VALUES (?, ?, 1, ?, ?, ?, 'Cash', NOW())
        `;
        
        const params = [
            business_id,
            branch_id,
            exp.amount,
            today,
            exp.name
        ];

        await db.query(sql, params);
        totalInserted++;
    }

    console.log(`✅ Successfully inserted ${totalInserted} expense records!`);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Error inserting expense data:", err);
    process.exit(1);
});
