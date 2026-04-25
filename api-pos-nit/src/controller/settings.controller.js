const { db, logError, sendTelegramMessage, setTelegramWebhook } = require("../util/helper");

exports.getSettings = async (req, res) => {
    try {
        const { business_id } = req;
        const [data] = await db.query(
            "SELECT name, owner_name, email, phone, logo, address, website, tax_percent, service_charge, kh_exchange_rate, currency_symbol, telegram_link, facebook_link, telegram_token, telegram_chat_id, telegram_mode, telegram_webhook_url, promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active, global_discount, global_bogo_active, global_bogo_text, promo_scope, promo_applied_categories, promo_applied_products, promo_tag, promo_tag_color, promo_desc, promo_buy_qty, promo_get_qty, promo_start_date, promo_end_date, discount_scope, discount_applied_categories, discount_applied_products FROM businesses WHERE id = ?",
            [business_id]
        );

        if (data.length === 0) {
            return res.status(404).json({ message: "Business not found" });
        }

        res.json({ settings: data[0] });
    } catch (error) {
        logError("settings.getSettings", error, res);
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { business_id } = req;
        const {
            name, owner_name, email, phone, address, website,
            tax_percent, service_charge, kh_exchange_rate,
            currency_symbol, telegram_link, facebook_link,
            telegram_token, telegram_chat_id, telegram_mode, telegram_webhook_url,
            promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active,
            global_discount, global_bogo_active, global_bogo_text, promo_scope, 
            promo_applied_categories, promo_applied_products,
            promo_tag, promo_tag_color, promo_desc, promo_buy_qty, promo_get_qty,
            promo_start_date, promo_end_date,
            discount_scope, discount_applied_categories, discount_applied_products
        } = req.body;

        const logo = req.file?.path || req.file?.filename;

        let sql = `
      UPDATE businesses SET 
        name = ?, owner_name = ?, email = ?, phone = ?, address = ?, website = ?,
        tax_percent = ?, service_charge = ?, kh_exchange_rate = ?,
        currency_symbol = ?, telegram_link = ?, facebook_link = ?,
        telegram_token = ?, telegram_chat_id = ?, telegram_mode = ?, telegram_webhook_url = ?,
        promo_title = ?, promo_subtitle = ?, promo_image = ?, promo_discount = ?, promo_is_active = ?,
        global_discount = ?, global_bogo_active = ?, global_bogo_text = ?, promo_scope = ?, 
        promo_applied_categories = ?, promo_applied_products = ?,
        promo_tag = ?, promo_tag_color = ?, promo_desc = ?,
        promo_buy_qty = ?, promo_get_qty = ?,
        promo_start_date = ?, promo_end_date = ?,
        discount_scope = ?, discount_applied_categories = ?, discount_applied_products = ?
    `;
        let params = [
            name, owner_name, email, phone, address, website,
            tax_percent, service_charge, kh_exchange_rate,
            currency_symbol, telegram_link, facebook_link,
            telegram_token, telegram_chat_id, telegram_mode, telegram_webhook_url,
            promo_title, promo_subtitle, promo_image, promo_discount, promo_is_active || 0,
            global_discount || 0, global_bogo_active || 0, global_bogo_text || '', promo_scope || 'all',
            promo_applied_categories || '[]', promo_applied_products || '[]',
            promo_tag || '', promo_tag_color || '#C8952A', promo_desc || '',
            promo_buy_qty || 1, promo_get_qty || 1,
            promo_start_date || null, promo_end_date || null,
            discount_scope || 'all', discount_applied_categories || '[]', discount_applied_products || '[]'
        ];

        if (logo) {
            sql += ", logo = ?";
            params.push(logo);
        }

        sql += " WHERE id = ?";
        params.push(business_id);

        await db.query(sql, params);

        res.json({
            success: true,
            message: "Settings updated successfully",
            logo: logo // return the new logo filename
        });
    } catch (error) {
        logError("settings.updateSettings", error, res);
    }
};

exports.testTelegramNotification = async (req, res) => {
    try {
        const { telegram_token, telegram_chat_id, telegram_mode, telegram_webhook_url } = req.body;

        if (!telegram_token || !telegram_chat_id) {
            return res.status(400).json({ message: "Please enter both Token and Chat ID first!" });
        }

        // Automatically set or clear the webhook based on the selected mode
        await setTelegramWebhook(telegram_token, business_id, telegram_mode, telegram_webhook_url);
        
        const keyboard = {
            inline_keyboard: [
              [
                { text: "📊 Today Sales", callback_data: "report_today_sale" },
                { text: "💸 Today Expense", callback_data: "report_today_expense" }
              ],
              [
                { text: "⚠️ Stock Alert", callback_data: "report_stock_alert" }
              ]
            ]
        };

        const msg = `📢 <b>TEST CONNECTION SUCCESSFUL!</b>\n` +
                    `--------------------------\n` +
                    `✅ Your POS system is now successfully linked to this Telegram bot.\n` +
                    `🚀 Ready to receive real-time order notifications!\n\n` +
                    `📅 ${new Date().toLocaleString()}`;
        
        await sendTelegramMessage(business_id, msg, [], keyboard, { 
            token: telegram_token, 
            chatId: telegram_chat_id 
        });

        res.json({ success: true, message: "Test message sent! Please check your Telegram." });

    } catch (error) {
        console.error("Test Telegram Error:", error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send test message.",
            error: error.response?.data?.description || error.message
        });
    }
};
