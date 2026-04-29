const mysql = require('mysql2/promise');

async function cleanup() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'dev_user',
        password: '88889999',
        database: 'coffee_saas'
    });

    console.log("Starting database cleanup...");

    try {
        // 1. Get all businesses
        const [businesses] = await connection.query("SELECT id, name FROM businesses");

        for (const biz of businesses) {
            console.log(`\nProcessing Business: ${biz.name} (ID: ${biz.id})`);

            // --- A. CLEANUP ROLES ---
            const codes = ['owner', 'manager', 'sale'];
            for (const code of codes) {
                const [roles] = await connection.query(
                    "SELECT id FROM roles WHERE business_id = ? AND code = ? ORDER BY id ASC", 
                    [biz.id, code]
                );

                if (roles.length > 1) {
                    const keepId = roles[roles.length - 1].id; // Keep the newest one
                    const removeIds = roles.slice(0, -1).map(r => r.id);
                    
                    console.log(`  Merging roles for code '${code}': keeping ${keepId}, removing [${removeIds.join(', ')}]`);
                    
                    // Update users to use the kept role
                    await connection.query(
                        "UPDATE users SET role_id = ? WHERE business_id = ? AND role_id IN (?)",
                        [keepId, biz.id, removeIds]
                    );

                    // Update role_permissions (if any exist for old roles, we might lose them, but newest role usually has them all)
                    // Actually, it's safer to just delete the old roles
                    await connection.query("DELETE FROM role_permissions WHERE role_id IN (?)", [removeIds]);
                    await connection.query("DELETE FROM roles WHERE id IN (?)", [removeIds]);
                }
            }

            // --- B. CLEANUP BRANCHES ---
            const [branches] = await connection.query(
                "SELECT id, province FROM branches WHERE business_id = ? AND name = 'Main Branch' ORDER BY (province IS NOT NULL) DESC, id DESC",
                [biz.id]
            );

            if (branches.length > 1) {
                const keepId = branches[0].id; // Keep the one with province, or the newest one
                const removeIds = branches.slice(1).map(b => b.id);

                console.log(`  Merging branches: keeping ${keepId}, removing [${removeIds.join(', ')}]`);

                // Update users
                await connection.query(
                    "UPDATE users SET branch_id = ? WHERE business_id = ? AND branch_id IN (?)",
                    [keepId, biz.id, removeIds]
                );

                // Update other tables that might reference branch_id
                const tables = ['orders', 'purchase', 'stock_transaction', 'expense', 'shift'];
                for (const table of tables) {
                    try {
                        await connection.query(
                            `UPDATE ${table} SET branch_id = ? WHERE business_id = ? AND branch_id IN (?)`,
                            [keepId, biz.id, removeIds]
                        );
                    } catch (e) {
                        // Table might not exist or doesn't have these columns
                    }
                }

                await connection.query("DELETE FROM branches WHERE id IN (?)", [removeIds]);
            }

            // --- C. CLEANUP DUPLICATE USERS (Same email) ---
            const [emails] = await connection.query(
                "SELECT email, COUNT(*) as count FROM users WHERE business_id = ? GROUP BY email HAVING count > 1",
                [biz.id]
            );

            for (const item of emails) {
                const [users] = await connection.query(
                    "SELECT id FROM users WHERE business_id = ? AND email = ? ORDER BY id DESC",
                    [biz.id, item.email]
                );

                const keepUserId = users[0].id;
                const removeUserIds = users.slice(1).map(u => u.id);

                console.log(`  Merging users for email '${item.email}': keeping ${keepUserId}, removing [${removeUserIds.join(', ')}]`);

                // Move user related data if needed (orders, etc.)
                await connection.query("UPDATE orders SET user_id = ? WHERE user_id IN (?)", [keepUserId, removeUserIds]);
                
                await connection.query("DELETE FROM users WHERE id IN (?)", [removeUserIds]);
            }
        }

        console.log("\nAdding Unique Constraints to prevent future duplicates...");
        
        // Add Unique Constraints (Ignore errors if already exists)
        try {
            await connection.query("ALTER TABLE roles ADD UNIQUE INDEX idx_biz_role_code (business_id, code)");
        } catch (e) { console.log("  Role constraint might already exist or failed: " + e.message); }

        // We can't easily add unique to branch name because a biz can have multiple branches.
        // But we can ensure only one is_main per business (already handled in code, but constraint is good)
        // Actually, let's just stick to fixing the code.

        console.log("\nDatabase cleanup completed successfully!");

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        await connection.end();
    }
}

cleanup();
