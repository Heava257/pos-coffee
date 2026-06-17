const { db } = require("./src/util/helper");
const { sendExpiryReminder } = require("./src/util/email");

const testReminders = async () => {
    console.log("🚀 Starting Manual Expiry Reminder Test...");
    try {
        // Find businesses with subscriptions expiring in 7, 3, 1, or 0 days
        const [reminders] = await db.query(`
            SELECT 
                b.id as business_id, 
                b.name as business_name, 
                u.email as owner_email,
                DATEDIFF(s.end_date, CURDATE()) as days_left
            FROM subscriptions s
            JOIN businesses b ON s.business_id = b.id
            JOIN users u ON b.id = u.business_id AND u.role_id IN (SELECT id FROM roles WHERE code = 'owner')
            WHERE s.status = 'active'
              AND DATEDIFF(s.end_date, CURDATE()) IN (7, 3, 1, 0)
        `);

        if (reminders.length === 0) {
            console.log("⚠️ No businesses found with expiry in 7, 3, 1, or 0 days.");
            console.log("💡 Tip: Go to Database and set an end_date to exactly 7 days from now to test.");
            process.exit(0);
        }

        console.log(`Found ${reminders.length} businesses to notify.`);
        for (const item of reminders) {
            console.log(`\n--- Sending to: ${item.owner_email} ---`);
            const info = await sendExpiryReminder(item.owner_email, item.business_name, item.days_left);
            if (info) {
                console.log(`✅ SUCCESS! Message ID: ${info.messageId}`);
                console.log(`📩 Accepted: ${info.accepted}`);
                console.log(`❌ Rejected: ${info.rejected}`);
                console.log(`📄 Response: ${info.response}`);
            } else {
                console.log(`❌ FAILED to send to ${item.owner_email}`);
            }
        }
        
        console.log("✅ Manual test completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
};

testReminders();
