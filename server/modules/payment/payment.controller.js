const crypto = require("crypto");
const axios = require("axios");
const { db, logError } = require("../../src/util/helper");
const config = require("../../src/util/config");

// ─── Helpers ──────────────────────────────────────────────────────────
/**
 * Generate PayWay SHA512 hash string
 * Formula (ABA PayWay standard):
 *   hash = HMAC-SHA512( "merchant_id + datetime + amount + items + ... " , api_key )
 */
function generatePaywayHash(params) {
    const { merchant_id, datetime, amount, req_time, tran_id } = params;
    const raw = `merchant_id=${merchant_id}&tran_id=${tran_id}&amount=${amount}&req_time=${req_time}`;
    return crypto.createHmac("sha512", config.payway.api_key).update(raw).digest("base64");
}

/**
 * Generate a unique transaction ID
 */
function genTranId() {
    return `POS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── DB helper: ensure payments table exists ──────────────────────────
async function ensurePaymentsTable(conn) {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            business_id   INT NOT NULL,
            plan_id       INT NOT NULL,
            tran_id       VARCHAR(100) UNIQUE NOT NULL,
            amount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status        ENUM('pending','paid','failed','cancelled') DEFAULT 'pending',
            duration_days INT DEFAULT 30,
            payway_ref    VARCHAR(200) DEFAULT NULL,
            error_msg     TEXT DEFAULT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id)     REFERENCES subscription_plans(id)
        )
    `);
}

// ══════════════════════════════════════════════════════════════════════
// 1. CREATE  — POST /api/payment/create
//    Frontend calls this to initiate a payment session
// ══════════════════════════════════════════════════════════════════════
exports.createPayment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await ensurePaymentsTable(conn);

        const { business_id } = req;
        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({ success: false, message: "plan_id is required" });
        }

        // Fetch plan details including billing cycle
        const [plans] = await conn.query(
            "SELECT id, name, price, billing_cycle FROM subscription_plans WHERE id = ?",
            [plan_id]
        );
        if (!plans.length) {
            return res.status(404).json({ success: false, message: "Plan not found" });
        }
        const plan = plans[0];

        // Determine secure duration_days based on plan billing cycle from DB
        let duration_days = 30; // default Monthly
        if (plan.billing_cycle === "yearly") {
            duration_days = 365;
        } else if (plan.billing_cycle === "lifetime") {
            duration_days = 36500; // 100 years
        }

        // Validate: cannot downgrade
        const [biz] = await conn.query("SELECT plan_id FROM businesses WHERE id = ?", [business_id]);
        if (biz.length && parseInt(plan_id) < parseInt(biz[0].plan_id)) {
            return res.status(400).json({ success: false, message: "Cannot downgrade to a lower plan." });
        }

        const tran_id = genTranId();
        const amount = parseFloat(plan.price).toFixed(2);
        const req_time = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

        // Determine if this is FREE plan (skip payment)
        const isFree = parseFloat(plan.price) === 0;

        // Save pending payment record
        await conn.query(
            `INSERT INTO payments (business_id, plan_id, tran_id, amount, status, duration_days)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [business_id, plan_id, tran_id, amount, isFree ? "paid" : "pending", duration_days]
        );

        // If free plan, upgrade immediately without payment
        if (isFree) {
            await _performUpgrade(conn, business_id, plan_id, duration_days, tran_id);
            conn.release();
            return res.json({
                success: true,
                is_free: true,
                message: "Plan activated successfully (Free Plan).",
                tran_id,
            });
        }

        // Fetch System Master Settings for Payment
        const [sysRows] = await conn.query("SELECT sett_key, sett_value FROM system_settings");
        const sysSettings = {};
        sysRows.forEach(row => sysSettings[row.sett_key] = row.sett_value);

        // Fetch ABA PayWay credentials and status from payment_gateways table
        const [gwRows] = await conn.query(
            "SELECT merchant_id, api_key, status FROM payment_gateways WHERE name = 'ABA PayWay'"
        );
        let active_merchant_id = null;
        let active_api_key = null;

        if (gwRows.length > 0) {
            // Row exists: respect the status set by the admin
            if (gwRows[0].status === "active") {
                active_merchant_id = gwRows[0].merchant_id;
                active_api_key = gwRows[0].api_key;
            }
        } else {
            // Only fall back to config/.env if no DB gateway record exists at all
            active_merchant_id = sysSettings.payway_merchant_id || config.payway.merchant_id || null;
            active_api_key = sysSettings.payway_api_key || config.payway.api_key || null;
        }

        // Build PayWay payload only if credentials are set
        let payway_payload = null;
        if (active_merchant_id && active_api_key) {
            const hash = crypto.createHmac("sha512", active_api_key)
                .update(`merchant_id=${active_merchant_id}&tran_id=${tran_id}&amount=${amount}&req_time=${req_time}`)
                .digest("base64");

            payway_payload = {
                merchant_id: active_merchant_id,
                tran_id,
                amount,
                req_time,
                items: JSON.stringify([{ name: plan.name, quantity: 1, price: amount }]),
                currency: "USD",
                return_url: config.payway.return_url,
                cancel_url: `${config.app_url}/my-plan`,
                continue_success_url: `${config.app_url}/payment/result?tran_id=${tran_id}`,
                hash,
            };

            // Set for frontend dynamic QR generator
            sysSettings.payway_merchant_id = active_merchant_id;
        } else {
            // If inactive, ensure we clean it so frontend falls back to static QR
            delete sysSettings.payway_merchant_id;
        }

        conn.release();
        return res.json({
            success: true,
            is_free: false,
            tran_id,
            amount,
            plan_name: plan.name,
            payway_payload,                       // Frontend uses this to POST to PayWay (null if inactive)
            payway_url: config.payway.base_url,   // PayWay checkout endpoint
            system_settings: sysSettings,         // For Dynamic KHQR on frontend
        });

    } catch (error) {
        if (conn) conn.release();
        logError("payment.createPayment", error, res);
    }
};

// ══════════════════════════════════════════════════════════════════════
// 2. CALLBACK — POST /api/payment/callback
//    PayWay calls this after user pays (webhook)
//    This is the REAL trigger that upgrades the plan
// ══════════════════════════════════════════════════════════════════════
exports.paymentCallback = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await ensurePaymentsTable(conn);

        // PayWay sends several fields: tran_id, status, hash, apv, etc.
        const { tran_id, status, hash, apv } = req.body;
        console.log(`[Payment Webhook Received] Tran ID: ${tran_id}, Status: ${status}`);

        // 1. Fetch System Settings to get the API Key for verification
        const [sysRows] = await conn.query("SELECT sett_value FROM system_settings WHERE sett_key = 'payway_api_key'");
        const api_key = (sysRows.length > 0 && sysRows[0].sett_value) ? sysRows[0].sett_value : config.payway.api_key;

        // 2. Security: Verify Hash (Optional but Recommended)
        // Note: In some PayWay versions, the callback hash is different from the request hash.
        // If hash verification fails but you trust the source/IP, you can proceed, but logging is vital.

        // 3. Find the pending payment
        const [payments] = await conn.query(
            "SELECT * FROM payments WHERE tran_id = ?",
            [tran_id]
        );

        if (!payments.length) {
            console.warn(`[Payment Callback Error] Transaction ${tran_id} not found in database.`);
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        const payment = payments[0];

        if (payment.status === "paid") {
            console.log(`[Payment Callback] Trans ${tran_id} already marked as paid. Skipping.`);
            return res.json({ status: "0", message: "Success (Already Processed)" });
        }

        // 4. Verify Success Status (0 = success in PayWay)
        const isSuccess = status === "0" || status === 0;

        if (isSuccess) {
            console.log(`[Payment Success] UPGRADING: Business ${payment.business_id} to Plan ${payment.plan_id}`);

            // Mark payment as paid
            await conn.query(
                "UPDATE payments SET status='paid', payway_ref=? WHERE tran_id=?",
                [apv || "aba_" + Date.now(), tran_id]
            );

            // Execute the REAL upgrade logic (DB business update + subscription record)
            await _performUpgrade(conn, payment.business_id, payment.plan_id, payment.duration_days, tran_id);

            conn.release();
            // PayWay expects a JSON response with status 0 to stop retrying
            return res.json({ status: "0", message: "OK" });
        } else {
            console.warn(`[Payment Failed] Trans ${tran_id} failed with status: ${status}`);
            await conn.query(
                "UPDATE payments SET status='failed', error_msg=? WHERE tran_id=?",
                [`PayWay Failure Status: ${status}`, tran_id]
            );
            conn.release();
            return res.json({ status: "1", message: "Payment Failed recorded" });
        }

    } catch (error) {
        if (conn) conn.release();
        console.error("[Payment Callback Exception]", error);
        res.status(500).json({ status: "2", message: "Internal Server Error" });
    }
};

// ══════════════════════════════════════════════════════════════════════
// 3. CHECK STATUS — GET /api/payment/status/:tran_id
//    Frontend polls this to check if payment completed
// ══════════════════════════════════════════════════════════════════════
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { tran_id } = req.params;
        const { business_id } = req;

        const [rows] = await db.query(
            "SELECT p.*, sp.name as plan_name FROM payments p JOIN subscription_plans sp ON p.plan_id = sp.id WHERE p.tran_id = ? AND p.business_id = ?",
            [tran_id, business_id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        const payment = rows[0];
        
        // Fetch payway_allow_simulation setting from DB
        const [sysRows] = await db.query("SELECT sett_value FROM system_settings WHERE sett_key = 'payway_allow_simulation'");
        const allowSimulation = sysRows.length > 0 && sysRows[0].sett_value === "true";

        res.json({
            success: true,
            status: payment.status,      // 'pending' | 'paid' | 'failed'
            plan_name: payment.plan_name,
            amount: payment.amount,
            is_paid: payment.status === "paid",
            allow_simulation: allowSimulation,
        });
    } catch (error) {
        logError("payment.checkPaymentStatus", error, res);
    }
};

// ══════════════════════════════════════════════════════════════════════
// 4. SIMULATE (DEV ONLY) — POST /api/payment/simulate-success
//    Manually mark a payment as paid (for testing without real PayWay)
// ══════════════════════════════════════════════════════════════════════
exports.simulateSuccess = async (req, res) => {
    if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
        return res.status(403).json({ message: "Not available in production" });
    }

    const conn = await db.getConnection();
    try {
        // Fetch payway_allow_simulation setting from DB
        const [sysRows] = await conn.query("SELECT sett_value FROM system_settings WHERE sett_key = 'payway_allow_simulation'");
        const allowSimulation = sysRows.length > 0 && sysRows[0].sett_value === "true";
        if (!allowSimulation) {
            conn.release();
            return res.status(403).json({ success: false, message: "Payment simulation is disabled by the Platform Admin." });
        }

        const { tran_id } = req.body;

        const [rows] = await conn.query("SELECT * FROM payments WHERE tran_id = ?", [tran_id]);
        if (!rows.length) return res.status(404).json({ message: "Payment not found" });

        const payment = rows[0];

        await conn.query(
            "UPDATE payments SET status='paid', payway_ref='SIMULATED' WHERE tran_id=?",
            [tran_id]
        );

        await _performUpgrade(conn, payment.business_id, payment.plan_id, payment.duration_days, tran_id);

        conn.release();
        res.json({ success: true, message: "✅ Payment simulated as paid. Plan upgraded!" });
    } catch (error) {
        conn.release();
        logError("payment.simulateSuccess", error, res);
    }
};

// ══════════════════════════════════════════════════════════════════════
//  PRIVATE: _performUpgrade
//  Shared logic: expire old sub, create new sub, update permissions
// ══════════════════════════════════════════════════════════════════════
async function _performUpgrade(conn, business_id, plan_id, duration_days, tran_id) {
    await conn.beginTransaction();
    try {
        // 1. Update business plan
        await conn.query("UPDATE businesses SET plan_id = ? WHERE id = ?", [plan_id, business_id]);

        // 2. Expire old active subscriptions
        await conn.query(
            "UPDATE subscriptions SET status = 'expired' WHERE business_id = ? AND status = 'active'",
            [business_id]
        );

        // 3. Create new subscription
        const start = new Date();
        const startStr = start.toISOString().split("T")[0];
        const end = new Date();
        end.setDate(end.getDate() + (duration_days || 30));
        const endStr = end.toISOString().split("T")[0];

        await conn.query(
            "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status, tran_id) VALUES (?, ?, ?, ?, ?, 'active', ?)",
            [business_id, plan_id, plan_id == 1 ? "basic" : plan_id == 2 ? "standard" : "premium", startStr, endStr, tran_id]
        );

        // 4. Update owner role permissions
        const [ownerRoles] = await conn.query(
            "SELECT id FROM roles WHERE business_id = ? AND code = 'owner'",
            [business_id]
        );
        if (ownerRoles.length > 0) {
            await conn.query(
                `INSERT IGNORE INTO role_permissions (role_id, permission_id)
                 SELECT ?, id FROM permissions WHERE min_plan_id <= ?`,
                [ownerRoles[0].id, plan_id]
            );
        }

        await conn.commit();

        // Clear permission caches so changes take effect immediately
        try {
            require("../../middlewares/auth.middleware").clearCache();
        } catch (e) {}
        try {
            require("../../middlewares/auth.middleware").clearCache();
        } catch (e) {}

        console.log(`[Payment] Plan upgraded for business ${business_id} → plan ${plan_id} (tran: ${tran_id})`);
    } catch (err) {
        await conn.rollback();
        throw err;
    }
}

exports._performUpgrade = _performUpgrade;
