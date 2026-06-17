const cron = require("node-cron");
const db = require("../config/database");

const start = () => {
    cron.schedule("5 0 * * *", async () => {
        console.log("[JOB] Running subscription expiry check...");
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [expiredSubs] = await conn.query(`
                SELECT s.business_id, s.id as sub_id
                FROM subscriptions s
                WHERE s.status = 'active'
                  AND s.end_date < CURDATE()
            `);

            for (const sub of expiredSubs) {
                const { business_id, sub_id } = sub;
                await conn.query("UPDATE subscriptions SET status = 'expired' WHERE id = ?", [sub_id]);
                await conn.query("UPDATE businesses SET plan_id = 1 WHERE id = ?", [business_id]);

                const [ownerRoles] = await conn.query(
                    "SELECT id FROM roles WHERE business_id = ? AND code = 'owner'",
                    [business_id]
                );

                if (ownerRoles.length > 0) {
                    const ownerRoleId = ownerRoles[0].id;
                    await conn.query(`
                        DELETE FROM role_permissions
                        WHERE role_id = ?
                          AND permission_id IN (
                              SELECT id FROM permissions WHERE min_plan_id > 1
                          )
                    `, [ownerRoleId]);
                }
                console.log(`[JOB] Business ID ${business_id} subscription expired.`);
            }

            await conn.commit();
        } catch (error) {
            await conn.rollback();
            console.error("[JOB ERROR] Subscription check failed:", error.message);
        } finally {
            conn.release();
        }
    });
};

module.exports = { start };
