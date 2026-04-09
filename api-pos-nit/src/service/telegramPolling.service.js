const axios = require("axios");
const { db } = require("../util/helper");

/**
 * This service allows fetching Telegram updates without a public webhook.
 * Useful for local development or servers without a static IP/Domain.
 */
class TelegramPollingService {
  constructor() {
    this.offsets = new Map(); // business_id -> last_update_id
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("🚀 Telegram Polling Service Started...");
    this.poll();
  }

  async poll() {
    while (this.isRunning) {
      try {
        // 1. Get all businesses using POLLING mode
        const [businesses] = await db.query(
          "SELECT id, telegram_token FROM businesses WHERE telegram_token IS NOT NULL AND telegram_token != '' AND telegram_mode = 'polling'"
        );

        for (const biz of businesses) {
          await this.getUpdates(biz.id, biz.telegram_token);
        }
      } catch (err) {
        // console.error("Polling Error loop:", err.message);
      }
      // Wait 3 seconds before next cycle
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  async getUpdates(business_id, token) {
    try {
      const offset = this.offsets.get(business_id) || 0;
      const apiBase = `https://api.telegram.org/bot${token}`;
      
      const res = await axios.get(`${apiBase}/getUpdates`, {
        params: { offset: offset + 1, timeout: 2, limit: 10 }
      });

      if (res.data.ok && res.data.result.length > 0) {
        for (const update of res.data.result) {
          this.offsets.set(business_id, update.update_id);
          await this.processUpdate(business_id, token, update);
        }
      }
    } catch (err) {
      // Token might be invalid, just ignore
    }
  }

  async processUpdate(business_id, token, update) {
    // We only care about callback_queries (button clicks)
    if (!update.callback_query) return;

    const callbackQuery = update.callback_query;
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const apiBase = `https://api.telegram.org/bot${token}`;

    const today = new Date().toISOString().split('T')[0];
    let responseText = "";
    let keyboard = null;

    try {
      if (data === "main_menu") {
        responseText = "<b>🏠 POS Bot Main Menu</b>\n\nChoose a report to view below:";
        keyboard = {
          inline_keyboard: [
              [{ text: "📊 Today Sales", callback_data: "report_today_sale" }, { text: "💸 Today Expense", callback_data: "report_today_expense" }],
              [{ text: "⚠️ Stock Alert", callback_data: "report_stock_alert" }]
          ]
        };
      } 
      else if (data === "report_today_sale") {
        const [rows] = await db.query(
          "SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(id) as count FROM orders WHERE business_id = ? AND DATE(created_at) = ?",
          [business_id, today]
        );
        responseText = `<b>📊 Today's Sales Report</b>\n` +
                       `--------------------------\n` +
                       `💰 Total Sale: <b>$${Number(rows[0].total).toLocaleString()}</b>\n` +
                       `📦 Total Ord: <b>${rows[0].count}</b>\n` +
                       `📅 Date: <b>${today}</b>\n` +
                       `--------------------------\n` +
                       `<i>Last updated: ${new Date().toLocaleTimeString()}</i>`;
      } 
      else if (data === "report_today_expense") {
        const [rows] = await db.query(
          "SELECT COALESCE(SUM(amount), 0) as total FROM expense WHERE business_id = ? AND DATE(expense_date) = ?",
          [business_id, today]
        );
        responseText = `<b>💸 Today's Expense Report</b>\n` +
                       `--------------------------\n` +
                       `🔻 Total Exp: <b>$${Number(rows[0].total).toLocaleString()}</b>\n` +
                       `📅 Date: <b>${today}</b>\n` +
                       `--------------------------\n` +
                       `<i>Last updated: ${new Date().toLocaleTimeString()}</i>`;
      } 
      else if (data === "report_stock_alert") {
        // 1. Get low stock ready products
        const [lowProducts] = await db.query(
          `SELECT p.name, bp.stock_qty as qty, bp.min_stock_alert as min
           FROM products p
           JOIN branch_products bp ON p.id = bp.product_id
           WHERE p.business_id = ? AND p.product_type = 'ready' AND bp.stock_qty <= bp.min_stock_alert
           ORDER BY bp.stock_qty ASC LIMIT 10`,
          [business_id]
        );

        // 2. Get low stock raw materials
        const [lowMaterials] = await db.query(
          `SELECT name, qty, min_stock as min, unit
           FROM raw_material
           WHERE business_id = ? AND qty <= min_stock AND status = 1
           ORDER BY qty ASC LIMIT 10`,
          [business_id]
        );

        if (lowProducts.length === 0 && lowMaterials.length === 0) {
          responseText = "✅ <b>Stock Status:</b>\nAll items and materials are well stocked!";
        } else {
          responseText = "⚠️ <b>Low Stock Alert:</b>\n" + 
                         "--------------------------\n";
          
          if (lowProducts.length > 0) {
            responseText += "<b>📦 Products:</b>\n" + 
                            lowProducts.map(i => `• ${i.name}: <b>${i.qty}</b> (Min: ${i.min})`).join("\n") + "\n\n";
          }

          if (lowMaterials.length > 0) {
            responseText += "<b>🌿 Ingredients:</b>\n" + 
                            lowMaterials.map(i => `• ${i.name}: <b>${Number(i.qty)} ${i.unit || ''}</b> (Min: ${Number(i.min)})`).join("\n") + "\n";
          }
          
          responseText += "--------------------------\n" +
                         `<i>Items reached re-order level</i>`;
        }
      }

      if (responseText) {
        if (!keyboard) {
            keyboard = {
                inline_keyboard: [
                    [{ text: "🔄 Refresh", callback_data: data }],
                    [{ text: "🏠 Main Menu", callback_data: "main_menu" }]
                ]
            };
        }

        // Use editMessageText to reduce clutter
        await axios.post(`${apiBase}/editMessageText`, {
          chat_id: chatId,
          message_id: messageId,
          text: responseText,
          parse_mode: "HTML",
          reply_markup: keyboard
        });
      }

      // Acknowledge the callback
      await axios.post(`${apiBase}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id
      });

    } catch (err) {
      if (err.response?.data?.description?.includes("message is not modified")) {
          // Ignore this error, it just means the data hasn't changed
          return;
      }
      console.error("Process Update Error:", err.response?.data || err.message);
    }
  }
}

module.exports = new TelegramPollingService();
