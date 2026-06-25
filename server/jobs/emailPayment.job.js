const cron = require("node-cron");
const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const db = require("../config/database");
const { _performUpgrade } = require("../src/controller/payment.controller");

// Set lock flag to prevent concurrent runs
let isRunning = false;

const start = () => {
    // Run every minute
    cron.schedule("*/1 * * * *", async () => {
        if (isRunning) {
            console.log("[EMAIL JOB] Already running. Skipping this iteration.");
            return;
        }

        let conn;
        try {
            conn = await db.getConnection();

            // Fetch configuration from system_settings table
            const [rows] = await conn.query(
                "SELECT sett_key, sett_value FROM system_settings WHERE sett_key IN ('payment_imap_host', 'payment_imap_port', 'payment_imap_user', 'payment_imap_pass')"
            );
            const settings = {};
            rows.forEach(row => settings[row.sett_key] = row.sett_value);

            const host = settings.payment_imap_host || "imap.gmail.com";
            const port = parseInt(settings.payment_imap_port || "993");
            const user = settings.payment_imap_user;
            const pass = settings.payment_imap_pass;

            if (!user || !pass) {
                // IMAP not configured yet. Skip.
                conn.release();
                isRunning = false;
                return;
            }

            isRunning = true;
            console.log("[EMAIL JOB] Connecting to IMAP server to scan for payments...");

            const client = new ImapFlow({
                host,
                port,
                secure: true,
                auth: { user, pass },
                logger: false
            });

            await client.connect();
            let lock = await client.getMailboxLock("INBOX");

            try {
                // Find all unread messages
                let messages = await client.search({ seen: false });
                console.log(`[EMAIL JOB] Found ${messages.length} unread emails.`);

                for (let seq of messages) {
                    let message = await client.fetchOne(seq, { source: true });
                    if (!message || !message.source) continue;

                    let parsed = await simpleParser(message.source);
                    const body = ((parsed.text || "") + " " + (parsed.html || "")).toLowerCase();

                    // Search for our Transaction ID format: POS-[timestamp]-[random]
                    const tranIdMatch = body.match(/pos-\d+-[a-z0-9]+/i);
                    if (tranIdMatch) {
                        const tran_id = tranIdMatch[0].toUpperCase();
                        console.log(`[EMAIL JOB] Found transaction ID in email: ${tran_id}`);

                        // Fetch payment from DB
                        const [payments] = await conn.query(
                            "SELECT * FROM payments WHERE tran_id = ?",
                            [tran_id]
                        );

                        if (payments.length > 0) {
                            const payment = payments[0];
                            if (payment.status === "pending") {
                                const expectedAmount = parseFloat(payment.amount).toFixed(2);
                                const expectedAmountAlt = parseFloat(payment.amount).toString();

                                // Check if the email body contains the amount
                                const hasAmount = body.includes(expectedAmount) || body.includes(expectedAmountAlt);

                                if (hasAmount) {
                                    console.log(`[EMAIL JOB] Payment verified for ${tran_id} (Amount: $${payment.amount}). Upgrading business ${payment.business_id}...`);
                                    
                                    // Mark payment as paid before running upgrade to prevent double execution
                                    await conn.query(
                                        "UPDATE payments SET status='paid', payway_ref=? WHERE tran_id=?",
                                        [`EMAIL_AUTO_${Date.now()}`, tran_id]
                                    );

                                    // Perform plan upgrade
                                    await _performUpgrade(conn, payment.business_id, payment.plan_id, payment.duration_days, tran_id);
                                    
                                    console.log(`[EMAIL JOB] Plan upgrade complete for business ${payment.business_id}.`);
                                } else {
                                    console.warn(`[EMAIL JOB] Found Transaction ${tran_id} but amount $${expectedAmount} was not found in the email.`);
                                }
                            } else {
                                console.log(`[EMAIL JOB] Transaction ${tran_id} is already processed (status: ${payment.status}).`);
                            }
                            
                            // Mark email as read to prevent scanning it again
                            await client.messageFlagsAdd(seq, ["\\Seen"]);
                        }
                    }
                }
            } finally {
                lock.release();
            }

            await client.logout();
        } catch (error) {
            console.error("[EMAIL JOB ERROR] Failed during scanning emails:", error.message);
        } finally {
            if (conn) conn.release();
            isRunning = false;
        }
    });
};

module.exports = { start };
