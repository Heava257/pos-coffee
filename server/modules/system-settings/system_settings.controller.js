const { db, logError } = require("../../src/util/helper");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const backupScheduler = require("../../src/service/backupScheduler.service");

exports.getSystemSettings = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT sett_key, sett_value FROM system_settings");
        const settings = {};
        rows.forEach(row => {
            settings[row.sett_key] = row.sett_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        logError("system_settings.getSystemSettings", error, res);
    }
};

exports.getPublicSystemSettings = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT sett_key, sett_value FROM system_settings WHERE sett_key = 'landing_page' OR sett_key LIKE 'flag_%'"
        );
        const settings = {};
        rows.forEach(row => {
            settings[row.sett_key] = row.sett_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        logError("system_settings.getPublicSystemSettings", error, res);
    }
};

exports.updateSystemSettings = async (req, res) => {
    try {
        const params = req.body;
        const keys = Object.keys(params);

        if (req.file) {
            params['payway_khqr_image'] = req.file.filename;
            keys.push('payway_khqr_image');
        }

        // Handle image removal if requested
        if (params.image_remove === '1') {
            const [rows] = await db.query("SELECT sett_value FROM system_settings WHERE sett_key = 'payway_khqr_image'");
            if (rows.length > 0 && rows[0].sett_value) {
                const oldPath = path.join(__dirname, '../../public/images', rows[0].sett_value);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            params['payway_khqr_image'] = null;
            if (!keys.includes('payway_khqr_image')) keys.push('payway_khqr_image');
        }

        for (const key of keys) {
            // Only update keys that exist in our system
            await db.query(
                "UPDATE system_settings SET sett_value = ? WHERE sett_key = ?",
                [params[key], key]
            );
        }

        if (keys.some(k => k.startsWith("backup_schedule_"))) {
            backupScheduler.reload();
        }

        res.json({ success: true, message: "System settings updated successfully" });
    } catch (error) {
        logError("system_settings.updateSystemSettings", error, res);
    }
};

exports.testTelegram = async (req, res) => {
    try {
        if (req.business_id !== 1) {
            return res.status(403).json({ error: "Forbidden", message: "Access denied." });
        }

        const { telegram_token, telegram_chat_id, test_message } = req.body;
        if (!telegram_token || !telegram_chat_id) {
            return res.status(400).json({ success: false, message: "Bot Token and Target Chat ID are required." });
        }

        const text = test_message || "🔔 <b>PlatformOS Integration Test</b>\nConnection handshake established successfully!";

        const response = await axios.post(`https://api.telegram.org/bot${telegram_token}/sendMessage`, {
            chat_id: telegram_chat_id,
            text: text,
            parse_mode: "HTML"
        });

        if (response.data && response.data.ok) {
            return res.json({ success: true, message: "Test alert sent successfully!" });
        } else {
            return res.status(400).json({ success: false, message: "Telegram API error: " + JSON.stringify(response.data) });
        }
    } catch (error) {
        console.error("testTelegram error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Connection failed: " + (error.response?.data?.description || error.message) 
        });
    }
};
